import { Collection , ObjectId} from "mongodb"
import { CommentModel, PostModel, UserModel } from "./types.ts";
import { GraphQLError } from "graphql";
import { encodeHex } from "jsr:@std/encoding/hex";

type Context = {
    UserCollection : Collection<UserModel>;
    PostCollection : Collection<PostModel>;
    CommentCollection : Collection<CommentModel>;
}

type QueryUserArgs = {
    id : string
}

type usrInput = {
    input: {
        name: string
        password: string
        email: string
    }
}

type updateUsrInput = {
    id: string,
    input: {
        name: string
        password: string
        email: string
    }
}

type postInput = {
    userId: string,
    input: {
        content : string
    }
}
type updtPostInput = {
    id: string,
    input: {
        content : string
    }
}
type addLikeToPost = {
    postId: string,
    userId: string
}
type cCommentInput = {
    userId: string,
    postId: string,
    input: {
        text: string
    } 
}
type updtCommentInput = {
    id : string,
    input: {
        text: string
    } 
}

export const resolvers = {
    Query: {
        users: async(_:unknown, __: unknown, c: Context) : Promise<UserModel[]>=> {
            const user = await c.UserCollection.find().toArray();
            return user;
        },
        user : async(_:unknown, args: QueryUserArgs, c: Context) : Promise<UserModel | null> => {
            const id = args.id;
            const user = c.UserCollection.findOne({id});
            return user;
        },
        posts : async(_: unknown, __: unknown, c: Context) : Promise<PostModel[]> =>{
            const post = await c.PostCollection.find().toArray();
            return post;
        },
        post : async(_ : unknown, args: QueryUserArgs, c: Context) : Promise<PostModel | null> => {
            const post = args.id;
            const user = c.PostCollection.findOne({post});
            return user;
        },
        comments: async (_: unknown, __: unknown, c: Context): Promise<CommentModel[]> => {
            const comments = await c.CommentCollection.find().toArray();
            return comments;
        },

        comment: async (_: unknown, args: QueryUserArgs, c: Context): Promise<CommentModel | null> => {
            const id = args.id;
            const comment = await c.CommentCollection.findOne({  _id: new ObjectId(id) });
            return comment;
        }

    },
    User: {
        id: (parent: UserModel) => {
            return parent._id?.toString();
        },
        posts: async (parent: UserModel, _: unknown, c: Context): Promise<PostModel[]> => {
            const post = parent.posts;
            const author = await c.PostCollection.find({_id : {$in: post}}).toArray();
            return author;
        },
        comments : async(parent: UserModel, _: unknown, c: Context): Promise<CommentModel[]> => {
            const comentarios = parent.comments;
            const coment = await c.CommentCollection.find({_id : {$in : comentarios}}).toArray();
            return coment;
        },
        likedPost : async(parent: UserModel, _:unknown, c:Context): Promise<PostModel[]> => {
            const likeds = parent.likedPosts;
            const mg = await c.PostCollection.find({_id : {$in : likeds}}).toArray();
            return mg;
        }
    },
    Post : {
        id : (parent: PostModel) => {
            return parent._id?.toString();
        },                               /*El | null se pone cuando en el schema no haya una exclamacion*/ 
        author : async(parent: PostModel, _:unknown, c: Context): Promise<UserModel> => {
            const autor = parent.author;
            const author = await c.UserCollection.findOne({autor});
            return author!;
        },
        comments : async(parent: PostModel, _:unknown, c: Context): Promise<CommentModel[]> => {
            const comentarios = parent.comments;
            const comments = await c.CommentCollection.find({_id : {$in: comentarios}}).toArray();
            return comments;
        },
        likes : async(parent: PostModel, _:unknown, c: Context): Promise<UserModel[]> => {
            const likes = parent.likes;
            const mgs = await c.UserCollection.find({_id : {$in: likes}}).toArray();
            return mgs;
        }
    },
    Comment : {
        id: (parent: CommentModel)=>{
            return parent._id?.toString();
        },
        author : async(parent: CommentModel, _:unknown, c: Context) => {
            const autor = parent.author;
            const author = await c.UserCollection.findOne({ autor });
            return author; 
        },
        post : async(parent:CommentModel, _: unknown, c: Context) => {
            const publicacion = parent.post;
            const post = await c.CommentCollection.findOne({ publicacion});
            return post;
        }
    },
    Mutation : {
        Mutation: {
            createUser: async (_: unknown, args: usrInput, c: Context) => {
                const { name, password, email } = args.input;
                const existsUser = await c.UserCollection.findOne({ email });
                if(existsUser) throw new GraphQLError("User exists");
    
                //Sacado de: https://docs.deno.com/examples/hashing/
                const hashedPassword = await encodeHex(password);
    
                const user = await c.UserCollection.insertOne({
                  name,
                  pwd: hashedPassword,
                  email,
                  posts: [],
                  comments: [],
                  likedPosts: []
                })
    
                return {
                    _id: user.insertedId,
                    name,
                    email,
                    posts: [],
                    comments: [],
                    likedPosts: []
                }
            },
    
            updateUser: async (_: unknown, args: updateUsrInput, ctx: Context) => {
                const { id } = args;
                const { name, password, email } = args.input;
    
                //Sacado de: https://docs.deno.com/examples/hashing/
                const hashedPassword = await encodeHex(password);
    
                const user = await ctx.UserCollection.findOne({  _id: new ObjectId(id) });
                if(!user) throw new GraphQLError("User not found");
                const updatedUser = await ctx.UserCollection.findOneAndUpdate({  _id: new ObjectId(id) }, { $set: { name, password: hashedPassword, email } });
                return updatedUser;
            },
    
            deleteUser: async (_: unknown, args: { id: string }, ctx: Context) => {
                const user = await ctx.UserCollection.findOneAndDelete({  _id: new ObjectId(args.id) });
                if(!user) throw new GraphQLError("User not found");
            },
    
    
            createPost: async (_: unknown, args: postInput, ctx: Context) => {
                const { userId } = args;
                const { content } = args.input;
    
                const user = await ctx.UserCollection.findOne({  _id: new ObjectId(userId) });
                if(!user) throw new GraphQLError("User not found");
    
                const post = await ctx.PostCollection.insertOne({
                  content,
                  comments: [],
                  author: user._id,
                  likes: []
                });
    
                return {
                    _id: post.insertedId,
                    content,
                    comments: [],
                    author: user._id,
                    likes: []
                }  
            },
    
            updatePost: async (_: unknown, args: updtPostInput, c: Context) => {
                const { id } = args;
                const { content } = args.input;
    
                const post = await c.PostCollection.findOne({  _id: new ObjectId(id) });
                if(!post) throw new GraphQLError("Post not found");
                const updatedPost = await c.PostCollection.findOneAndUpdate({  _id: new ObjectId(id) }, { $set: { content } });
                return updatedPost;
            },
    
            deletePost: async (_: unknown, args: { id: string }, c: Context) => {
                const post = await c.PostCollection.findOneAndDelete({  _id: new ObjectId(args.id) });
                if(!post) throw new GraphQLError("Post not found");
            },
    
    
            addLikeToPost: async (_: unknown, args: addLikeToPost, c: Context) => {
                const { postId, userId } = args;
    
                const post = await c.PostCollection.findOne({  _id: new ObjectId(postId) });
                if(!post) throw new GraphQLError("Post not found");
    
                const user = await c.UserCollection.findOne({  _id: new ObjectId(userId) });
                if(!user) throw new GraphQLError("User not found");
    
                await c.PostCollection.updateOne({  _id: new ObjectId(postId) }, { $push: { likes: new ObjectId(userId) } });
                return post;
            },
    
            removeLikeFromPost: async (_: unknown, args: addLikeToPost, c: Context) => {
                const { postId, userId } = args;
    
                const post = await c.PostCollection.findOne({  _id: new ObjectId(postId) });
                if(!post) throw new GraphQLError("Post not found");
    
                const user = await c.UserCollection.findOne({  _id: new ObjectId(userId) });
                if(!user) throw new GraphQLError("User not found");
    
                await c.PostCollection.updateOne({  _id: new ObjectId(postId) }, { $pull: { likes: new ObjectId(userId) } });
                return post;
            },
    
    
            createComment: async (_: unknown, args: cCommentInput, c: Context) => {
                const { userId, postId } = args;
                const { text } = args.input;
    
                const user = await c.UserCollection.findOne({  _id: new ObjectId(userId) });
                if(!user) throw new GraphQLError("User not found");
    
                const post = await c.PostCollection.findOne({  _id: new ObjectId(postId) });
                if(!post) throw new GraphQLError("Post not found");
    
                const comment = await c.CommentCollection.insertOne({
                  text,
                  author: user._id,
                  post: post._id
                });
    
                return {
                    _id: comment.insertedId,
                    text,
                    author: user._id,
                    post: post ._id
                }
            },
    
            updateComment: async (_: unknown, args: updtCommentInput, c: Context) => {
                const { id } = args;
                const { text } = args.input;
    
                const comment = await c.CommentCollection.findOne({  _id: new ObjectId(id) });
                if(!comment) throw new GraphQLError("Comment not found");
                const updatedComment = await c.CommentCollection.findOneAndUpdate({  _id: new ObjectId(id) }, { $set: { text } });
                return updatedComment;
            },
    
            deleteComment: async (_: unknown, args: { id: string }, c: Context) => {
                const comment = await c.CommentCollection.findOneAndDelete({  _id: new ObjectId(args.id) });
                if(!comment) throw new GraphQLError("Comment not found");
            }
        }

    }
    
}