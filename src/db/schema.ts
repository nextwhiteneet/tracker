import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/** Singleton row (id = 1) holding the user's profile + planner engine settings. */
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default(""),
  motto: text("motto").notNull().default(""),
  examName: text("exam_name").notNull().default("NEET"),
  examDate: text("exam_date").notNull().default(""),
  startDate: text("start_date").notNull().default(""),
  dailyTargetMinutes: integer("daily_target_minutes").notNull().default(360),
  speed: numeric("speed", { precision: 3, scale: 2 }).notNull().default("1.25"),
  style: text("style").notNull().default("steady"), // steady | intense | chill
  revisionEnabled: boolean("revision_enabled").notNull().default(true),
  revisionDay: integer("revision_day").notNull().default(0), // 0 = Sunday
  revisionMinutes: integer("revision_minutes").notNull().default(240),
  setupCompleted: boolean("setup_completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#E85C22"),
  icon: text("icon").notNull().default("atom"),
  lectureLength: integer("lecture_length").notNull().default(75),
  orderIndex: integer("order_index").notNull().default(0),
});

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  name: text("name").notNull(),
});

export const chapters = pgTable(
  "chapters",
  {
    id: serial("id").primaryKey(),
    subjectId: integer("subject_id").notNull(),
    name: text("name").notNull(),
    classLevel: integer("class_level").notNull().default(11),
    totalLectures: integer("total_lectures").notNull().default(4),
    orderIndex: integer("order_index").notNull().default(0),
    active: boolean("active").notNull().default(true),
  },
  (t) => [index("chapters_subject_idx").on(t.subjectId)]
);

export const routine = pgTable(
  "routine",
  {
    id: serial("id").primaryKey(),
    dayOfWeek: integer("day_of_week").notNull(), // 0 Sun .. 6 Sat
    subjectId: integer("subject_id").notNull(),
    lectures: integer("lectures").notNull().default(2),
  },
  (t) => [uniqueIndex("routine_day_subject_idx").on(t.dayOfWeek, t.subjectId)]
);

export const planItems = pgTable(
  "plan_items",
  {
    id: serial("id").primaryKey(),
    date: text("date").notNull(), // YYYY-MM-DD (local)
    subjectId: integer("subject_id").notNull(),
    chapterId: integer("chapter_id"),
    chapterName: text("chapter_name").notNull().default(""),
    lectureIndex: integer("lecture_index").notNull().default(1),
    minutes: integer("minutes").notNull().default(60),
    kind: text("kind").notNull().default("lecture"), // lecture | revision
    status: text("status").notNull().default("pending"), // pending | done
    doneAt: timestamp("done_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("plan_date_idx").on(t.date),
    index("plan_chapter_idx").on(t.chapterId),
    index("plan_status_date_idx").on(t.status, t.date),
  ]
);

export const revisions = pgTable(
  "revisions",
  {
    id: serial("id").primaryKey(),
    chapterId: integer("chapter_id").notNull(),
    rounds: integer("rounds").notNull().default(0),
    confidence: integer("confidence").notNull().default(0), // 0..5
    lastRevisedOn: text("last_revised_on"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [uniqueIndex("revisions_chapter_idx").on(t.chapterId)]
);

export const focusSessions = pgTable(
  "focus_sessions",
  {
    id: serial("id").primaryKey(),
    date: text("date").notNull(),
    minutes: integer("minutes").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("focus_date_idx").on(t.date)]
);

export const dayNotes = pgTable("day_notes", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  text: text("text").notNull().default(""),
});

export type Profile = typeof profiles.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Teacher = typeof teachers.$inferSelect;
export type Chapter = typeof chapters.$inferSelect;
export type RoutineRow = typeof routine.$inferSelect;
export type PlanItem = typeof planItems.$inferSelect;
export type RevisionRow = typeof revisions.$inferSelect;
