// src/FollowUps/eventSchema.js
import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  color: z.enum(["red", "blue", "green", "yellow", "purple", "pink", "orange"]),
  description: z.string().optional(),
}).refine((data) => {
  const start = data.startTime.split(":").map(Number);
  const end = data.endTime.split(":").map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  return endMinutes > startMinutes;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const validateEvent = (data) => {
  try {
    return { success: true, data: eventSchema.parse(data) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
};