import {OptionalId, ObjectId} from "mongodb"

export type CommentModel = OptionalId<{
    text: string,
    author: string,
    post: string,
}>

export type Comment = {
    id: string,
    text: string,
    author: User,
    post: Post,
}

export type PostModel = OptionalId<{
    content: string,
    author: string,
    comments: ObjectId[],
    likes: ObjectId[],
}>

export type Post = {
    id: string,
    content: string,
    author: User,
    comments: Comment[],
    likes: User[],
}

export type UserModel = OptionalId<{
    name: string,
    password: string,
    email: string,
    posts: ObjectId[],
    comments: ObjectId[],
    likedPosts: ObjectId[],
}>

export type User = {
    id: string,
    name: string,
    password: string,
    email: string,
    posts: Post[],
    comments: Comment[],
    likedPosts: Post[],
}