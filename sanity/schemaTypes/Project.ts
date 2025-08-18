export default {
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Name",
      type: "string",
    },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "نشط", value: "نشط" },
          { title: "مكتمل", value: "مكتمل" },
          { title: "مؤجل", value: "مؤجل" },
        ],
      },
    },
    {
      name: "user",
      title: "User",
      type: "reference",
      to: [{ type: "user" }],
    },
    {
      name: "subProjects",
      title: "Sub Projects",
      type: "array",
      of: [{ type: "reference", to: [{ type: "subProject" }] }],
    },
  ],
};
