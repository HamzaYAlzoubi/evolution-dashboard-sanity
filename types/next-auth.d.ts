import NextAuth from "next-auth"

declare module "next-auth" {
  interface Project {
    _id: string;
    name: string;
    status: string;
    subProjects: SubProject[];
  }

  interface SubProject {
    _id: string;
    name: string;
    status: string;
    hours: number;
    minutes: number;
  }

  interface SessionData {
    _id: string;
    date: string;
    hours: number;
    minutes: number;
    notes: string;
    project: { _id: string; name: string }; // Simplified, as it can be project or subProject
  }

  interface User {
    id: string
    email: string
    name: string
    dailyTarget: number
    projects: Project[]; // Add projects
    sessions: SessionData[]; // Add sessions
  }

  interface Session {
    user: User // Use the extended User interface
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    dailyTarget: number
  }
}