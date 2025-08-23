export default {
  name: "user",
  title: "User",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Full Name",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule: any) => Rule.required().email(),
      unique: true,
    },
    {
      name: "emailVerified",
      title: "Email Verified",
      type: "datetime",
    },
    {
      name: "password",
      title: "Password",
      type: "string",
      hidden: true, // Hide from Sanity Studio for security
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "image",
      title: "Profile Image",
      type: "image",
      options: {
        hotspot: true,
      },
    },
    {
      name: "dailyTarget",
      title: "Daily Target (hours)",
      type: "number",
      initialValue: 4,
      validation: (Rule: any) => Rule.min(1).max(24),
    },
    {
      name: "role",
      title: "Role",
      type: "string",
      options: {
        list: [
          { title: "User", value: "user" },
          { title: "Admin", value: "admin" },
        ],
      },
      initialValue: "user",
    },
    {
      name: "isActive",
      title: "Is Active",
      type: "boolean",
      initialValue: true,
    },
    {
      name: "lastLogin",
      title: "Last Login",
      type: "datetime",
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "email",
      media: "image",
    },
  },
}
