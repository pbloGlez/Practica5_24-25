export const schema = `#graphql

input CreateUserInput {
  name: String!,
  password: String!,
  email: String!
}

input CreatePostInput {
  content: String!,
  author: String!
}

input CreateCommentInput{
  text: String!,
  author: String!,
  post: String!
}

input UpdateUserInput{
  id: String!,
  name: String
  password: String
  email: String
}

input UpdatePostInput{
  id: String!,
  content: String!
}

input UpdateCommentInput{
  id: String!,
  text: String!
}

type User {
  id: ID!
  name: String!
  password: String!
  email: String!
  posts: [Post!]!
  comments: [Comment!]!
  likedPosts: [Post!]!
}
 
type Post {
  id: ID!
  content: String!
  author: User!
  comments: [Comment!]!
  likes: [User!]!
}
 
type Comment {
  id: ID!
  text: String!
  author: User!
  post: Post!
}

# Queries
type Query {
  users: [User!]!
  user(id: ID!): User
  
  posts: [Post!]!
  post(id: ID!): Post
  
  comments: [Comment!]!
  comment(id: ID!): Comment
}
 
# Mutations
type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput): Post!
  deletePost(id: ID!): Boolean!
  createComment(input: CreateCommentInput!): Comment!
  updateComment(id: ID!, input: UpdateCommentInput!): Comment!
  deleteComment(id: ID!): Boolean!
}
`