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
      name: "email",
      title: "Email",
      type: "string",
      unique: true,
    },
    {
      name: "password",
      title: "Password",
      type: "string",
      hidden: true, // Hide from Sanity Studio for security
    },
    {
      name: "dailyTarget",
      title: "Daily Target (hours)",
      type: "number",
      initialValue: 4,
    },
  ],
}
