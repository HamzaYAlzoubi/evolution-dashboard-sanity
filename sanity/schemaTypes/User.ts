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
      name: "dailyTarget",
      title: "Daily Target (hours)",
      type: "number",
      initialValue: 4,
    },
  ],
};
