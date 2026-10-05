import { getConfig } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import SetupWizard, { type ConfigJson } from "@/components/setup-client";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const user = await requireUser();
  const config = await getConfig(user.id);
  const payload: ConfigJson = {
    isEmpty: config.isEmpty,
    profile: {
      name: config.profile.name,
      motto: config.profile.motto,
      examDate: config.profile.examDate,
      startDate: config.profile.startDate,
      syllabusDeadline: config.profile.syllabusDeadline,
      selfStudyRatio: String(config.profile.selfStudyRatio),
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
        lectureMinutes: c.lectureMinutes,
        teacher: c.teacher,
      })),
    })),
    routine: config.routine.map((r) => ({ dayOfWeek: r.dayOfWeek, subjectKey: r.subjectKey, lectures: r.lectures })),
  };
  return <SetupWizard config={payload} />;
}
