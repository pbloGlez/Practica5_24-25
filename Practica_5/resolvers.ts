import { ClientSession, Collection, ObjectId } from "mongodb";
import { UserModel, PostModel, CommentModel } from "./types.ts";
import { GraphQLError } from "graphql";

type Context = {
  UserCollection: Collection<UserModel>;
  PostCollection: Collection<PostModel>;
  CommentCollection: Collection<CommentModel>;
};

type QueryIdArgs = {
  id: string;
};

type CreateUserInput = {
  input: {
      name: string
      password: string
      email: string
  }
}

type CreatePostInput = {
  input: {
    content: string,
    author: string
  }
}

type CreateCommentInput = {
  input: {
    text: string,
    author: string,
    post: string
  }
}

type UpdateUserInput = {
  id: string,
  input: {
      name: string
      password: string
      email: string
  }
}

type UpdatePostInput = {
  id: string,
  input: {
      content: string
  }
}

type UpdateCommentInput = {
  id: string,
  input: {
      text: string
  } 
}

export const resolvers = {
  User: {
    id: (parent: UserModel) => {
      return parent._id?.toString();
      },
    posts: async (parent: UserModel, _: unknown, ctx: Context) => {
        const ids = parent.posts;
        return await ctx.PostCollection.find({ _id: { $in: ids } }).toArray();
      },
    comments: async (parent: UserModel, _: unknown, ctx: Context) => {
        const ids = parent.comments;
        return await ctx.CommentCollection.find({ _id: { $in: ids } }).toArray();
      },
    likedPosts: async (parent: UserModel, _: unknown, ctx: Context) => {
        const ids = parent.posts;
        return await ctx.PostCollection.find({ _id: { $in: ids } }).toArray();
      },
  },
  Post: {
    id: (parent: PostModel) => {
        return parent._id?.toString();
      },
    author: async (parent: PostModel, _: unknown, ctx: Context) => {
        const id = parent.author;
        return await ctx.UserCollection.findOne({ _id: new ObjectId(id) });
      },
    comments: async (parent: PostModel, _: unknown, ctx: Context) => {
        const ids = parent.comments;
        return await ctx.CommentCollection.find({ _id: { $in: ids } }).toArray();
      },
    likes: async (parent: PostModel, _: unknown, ctx: Context) => {
        const ids = parent.likes;
        return await ctx.UserCollection.find({ _id: { $in: ids } }).toArray();
      },
  },
  Comment: {
    id: (parent: CommentModel) => {
        return parent._id?.toString();
      },
    author: async (parent: CommentModel, _: unknown, ctx: Context) => {
        const id = parent.author;
        return await ctx.UserCollection.findOne({ _id: new ObjectId(id) });
      },
    post: async (parent: CommentModel, _: unknown, ctx: Context) => {
        const id = parent.post;
        return await ctx.PostCollection.findOne({ _id: new ObjectId(id) });
      },
  },
  Query: {
    users: async (
        _: unknown,
        __: unknown,
        ctx: Context,
      ): Promise<UserModel[]> => {
        const users = await ctx.UserCollection.find().toArray();
        return users;
      },
    user: async (
        _: unknown,
        args: QueryIdArgs,
        ctx: Context,
      ): Promise<UserModel | null> => {
        const id = args.id;
  
        const user = await ctx.UserCollection.findOne({ _id: new ObjectId(id) });
        return user;
      },
    posts: async (
        _: unknown,
        __: unknown,
        ctx: Context,
      ): Promise<PostModel[]> => {
        const posts = await ctx.PostCollection.find().toArray();
        return posts;
      },
    post: async (
        _: unknown,
        args: QueryIdArgs,
        ctx: Context,
      ): Promise<PostModel | null> => {
        const id = args.id;
  
        const post = await ctx.PostCollection.findOne({ _id: new ObjectId(id) });
        return post;
      },
    comments: async (
        _: unknown,
        __: unknown,
        ctx: Context,
      ): Promise<CommentModel[]> => {
        const comments = await ctx.CommentCollection.find().toArray();
        return comments;
      },
    comment: async (
        _: unknown,
        args: QueryIdArgs,
        ctx: Context,
      ): Promise<CommentModel | null> => {
        const id = args.id;
  
        const comment = await ctx.CommentCollection.findOne({ _id: new ObjectId(id) });
        return comment;
      },
  },
  Mutation: {
    createUser: async (
        _: unknown,
        args: CreateUserInput,
        ctx: Context,
      ): Promise<UserModel> => {

        if (!ctx.UserCollection) {
          throw new GraphQLError("User collection is not initialized");
        }

        const { name, password, email } = args.input;
        const existsUser = await ctx.UserCollection.findOne({ email });
        if (existsUser) throw new GraphQLError("Uses Exists");
  
        const user = await ctx.UserCollection.insertOne({
          name,
          password,
          email,
          posts: [],
          comments: [],
          likedPosts: []
        })

        return {
            _id: user.insertedId,
            name,
            password,
            email,
            posts: [],
            comments: [],
            likedPosts: []
        }
  
        
      },
    createPost: async (
        _: unknown,
        args: CreatePostInput,
        ctx: Context,
      ): Promise<PostModel> => {
        const { content, author} = args.input;
        const existsUser = await ctx.UserCollection.findOne({ _id: new ObjectId(author)});
        if (!existsUser) throw new GraphQLError("Author Does Not Exists");
  
        const post = await ctx.PostCollection.insertOne({
          content,
          author,
          comments: [],
          likes: []
        });
  
        return {
          _id: post.insertedId,
          content,
          author,
          comments: [],
          likes: []
        };
      },
    createComment: async (
        _: unknown,
        args: CreateCommentInput,
        ctx: Context,
      ): Promise<CommentModel> => {
        const { text, author, post } = args.input;
        const existsUser = await ctx.UserCollection.findOne({ _id: new ObjectId(author) });
        if (!existsUser) throw new GraphQLError("Author Does Not Exists");
        const existsPost = await ctx.PostCollection.findOne({ _id: new ObjectId(post) });
        if (!existsPost) throw new GraphQLError("Post Does Not Exists");        
  
        const comment = await ctx.CommentCollection.insertOne({
          text,
          author,
          post
        });
  
        return {
          _id: comment.insertedId,
          text,
          author,
          post
        };
      },
      deleteUser: async (
        _: unknown,
        args: { id: string },
        ctx: Context) => {
        const existsUser = await ctx.UserCollection.findOneAndDelete({  _id: new ObjectId(args.id) });
        if(!existsUser) throw new GraphQLError("User not found");
        return true;
    },
    deletePost: async (
      _: unknown,
      args: { id: string },
      ctx: Context) => {
      const existsPost = await ctx.PostCollection.findOneAndDelete({  _id: new ObjectId(args.id) });
      if(!existsPost) throw new GraphQLError("Post not found");
      return true;
  },
  deleteComment: async (
    _: unknown,
    args: { id: string },
    ctx: Context) => {
    const existsComment = await ctx.CommentCollection.findOneAndDelete({  _id: new ObjectId(args.id) });
    if(!existsComment) throw new GraphQLError("Comment not found");
    return true;
},

updateUser: async (
  _: unknown,
  args: UpdateUserInput,
  ctx: Context) => {
  const { id } = args;
  const { name, password, email } = args.input;

  const existsUser = await ctx.UserCollection.findOne({  _id: new ObjectId(id) });
  if(!existsUser) throw new GraphQLError("User not found");
  const updatedUser = await ctx.UserCollection.findOneAndUpdate({  _id: new ObjectId(id) }, { $set: { name, password, email } });
  return updatedUser;
},

updatePost: async (
  _: unknown, 
  args: UpdatePostInput, 
  ctx: Context) => {
  const { id } = args;
  const { content } = args.input;

  const existsPost = await ctx.PostCollection.findOne({  _id: new ObjectId(id) });
  if(!existsPost) throw new GraphQLError("Post not found");
  const updatedPost = await ctx.PostCollection.findOneAndUpdate({  _id: new ObjectId(id) }, { $set: { content } });
  return updatedPost;
},

updateComment: async (
  _: unknown, 
  args: UpdateCommentInput, 
  ctx: Context) => {
  const { id } = args;
  const { text } = args.input;

  const existsComment = await ctx.CommentCollection.findOne({  _id: new ObjectId(id) });
  if(!existsComment) throw new GraphQLError("Comment not found");
  const updatedComment = await ctx.CommentCollection.findOneAndUpdate({  _id: new ObjectId(id) }, { $set: { text } });
  return updatedComment;
},

  },
};