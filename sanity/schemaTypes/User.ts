export default {
  name: "user",
  title: "User",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
    },
    {
      name: "campGoal",
      title: "هدف المعسكر",
      type: "string",
      description: "الهدف الذي يسعى المستخدم لتحقيقه خلال المعسكر",
    },
    {
      name: "email",
      title: "Email",
      type: "string",
      unique: true,
    },
    {
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true, // Enables hotspot for cropping
      },
    },
    {
      name: "password",
      title: "Password",
      type: "string",
      hidden: true, // Hide from Sanity Studio for security
    },
    {
      name: "dailyTarget",
      title: "Daily Target (minutes)",
      type: "number",
      description: "The daily target in minutes",
      initialValue: 240,
    },
    {
      name: "projects",
      title: "Projects",
      type: "array",
      of: [{ type: "reference", to: [{ type: "project" }] }],
    },
    {
      name: "sessions",
      title: "Sessions",
      type: "array",
      of: [{ type: "reference", to: [{ type: "session" }] }],
    },
    {
      name: 'isAdmin',
      title: 'Admin',
      type: 'boolean',
      description: 'Set to true if the user is an administrator',
      initialValue: false,
    },
  ],
}