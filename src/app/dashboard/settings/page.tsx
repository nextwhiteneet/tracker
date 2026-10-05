import { getConfig } from "@/lib/data";
import { SettingsClient } from "@/components/settings-client";
import { SectionHead } from "@/components/ui";
import type { ConfigJson } from "@/components/setup-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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

  return (
    <div className="page-enter space-y-7">
      <SectionHead
        eyebrow="Settings"
        title="Tune the machine."
        sub="Changes to subjects, chapters or routine rebuild your plan from today — your ticks are always preserved."
      />
      <SettingsClient config={payload} />
    </div>
  );
}
