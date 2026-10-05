import { getConfig } from "@/lib/data";
import SetupWizard, { type ConfigJson } from "@/components/setup-client";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const config = await getConfig();
  const payload: ConfigJson = {
    isEmpty: config.isEmpty,
    profile: {
      name: config.profile.name,
      motto: config.profile.motto,
      examDate: config.profile.examDate,
      startDate: config.profile.startDate,
      dailyTargetMinutes: config.profile.dailyTargetMinutes,
      speed: String(config.profile.speed),
      style: config.profile.style,
      revisionEnabled: config.profile.revisionEnabled,
      revisionDay: config.profile.revisionDay,
      revisionMinutes: config.profile.revisionMinutes,
    },
    subjects: config.subjects.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      color: s.color,
      icon: s.icon,
      lectureLength: s.lectureLength,
      teachers: s.teachers,
      chapters: s.chapters.map((c) => ({
        id: c.id,
        name: c.name,
        cls: c.cls,
        lectures: c.lectures,
        active: c.active,
        doneLectures: c.doneLectures,
      })),
    })),
    routine: config.routine.map((r) => ({ dayOfWeek: r.dayOfWeek, subjectKey: r.subjectKey, lectures: r.lectures })),
  };
  return <SetupWizard config={payload} />;
}
