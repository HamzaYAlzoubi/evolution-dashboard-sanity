export default {
  name: "session",
  title: "Session",
  type: "document",
  fields: [
    {
      name: "date",
      title: "Date",
      type: "date",
    },
    {
      name: "hours",
      title: "Hours",
      type: "number",
    },
    {
      name: "minutes",
      title: "Minutes",
      type: "number",
    },
    {
      name: "notes",
      title: "Notes",
      type: "text",
    },
    {
      name: "user",
      title: "User",
      type: "reference",
      to: [{ type: "user" }],
    },
    {
      name: "project",
      title: "Project",
      type: "reference",
      to: [{ type: "project" }, { type: "subProject" }],
    },
  ],
};
