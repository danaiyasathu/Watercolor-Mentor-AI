import { AchievementBadge, UserProfile, Submission, LessonDraft } from '../types';

export function calculateAchievements(
  userProfile: UserProfile,
  completedLessons: number[] = [],
  submissions: Submission[] = [],
  lessonDrafts: Record<number, LessonDraft> = {}
): AchievementBadge[] {
  const notesCount = Object.values(lessonDrafts).filter(
    (d) => d && d.notes && d.notes.trim().length > 0
  ).length;

  const firstThreeDone = [0, 1, 2].every((id) => completedLessons.includes(id));
  const allEightDone = [0, 1, 2, 3, 4, 5, 6, 7].every((id) => completedLessons.includes(id));

  return [
    {
      id: 'first_step',
      title: 'ก้าวแรกแห่งศิลปิน',
      englishTitle: 'First Step',
      description: 'ลงทะเบียนผู้เรียนและเริ่มต้นก้าวแรกในโลกสีน้ำ',
      iconName: 'Sparkles',
      category: 'milestone',
      unlocked: userProfile.isOnboarded,
      progress: userProfile.isOnboarded ? 1 : 0,
      maxProgress: 1,
    },
    {
      id: 'first_lesson',
      title: 'หยดสีแรกบนกระดาษ',
      englishTitle: 'First Brushstroke',
      description: 'ส่งผลงานและผ่านการประเมินบทเรียนแรกสำเร็จ',
      iconName: 'Brush',
      category: 'milestone',
      unlocked: completedLessons.length >= 1,
      progress: Math.min(completedLessons.length, 1),
      maxProgress: 1,
    },
    {
      id: 'first_three_lessons',
      title: 'รากฐาน 3 บทแรก',
      englishTitle: 'Foundation Trio (3 Lessons)',
      description: 'ผ่าน 3 บทเรียนแรกสำเร็จ (ทำความรู้จักอุปกรณ์, การคุมน้ำ, และเปียกบนเปียก)',
      iconName: 'Award',
      category: 'milestone',
      unlocked: firstThreeDone || completedLessons.length >= 3,
      progress: Math.min(completedLessons.length, 3),
      maxProgress: 3,
    },
    {
      id: 'water_master',
      title: 'ผู้ควบคุมสายน้ำ',
      englishTitle: 'Water Alchemist',
      description: 'ผ่านบทที่ 1 การควบคุมน้ำและสี (Flat & Graded Wash)',
      iconName: 'Droplets',
      category: 'skill',
      unlocked: completedLessons.includes(1),
      progress: completedLessons.includes(1) ? 1 : 0,
      maxProgress: 1,
    },
    {
      id: 'color_wizard',
      title: 'นักปรุงเฉดสี',
      englishTitle: 'Color Wizard',
      description: 'ผ่านบทที่ 4 การผสมสีและวงล้อสีจากแม่สี 3 สี',
      iconName: 'Palette',
      category: 'skill',
      unlocked: completedLessons.includes(4),
      progress: completedLessons.includes(4) ? 1 : 0,
      maxProgress: 1,
    },
    {
      id: 'halfway_journey',
      title: 'ครึ่งทางสู่นักวาด',
      englishTitle: 'Halfway Voyager (4 Lessons)',
      description: 'เดินทางผ่านครึ่งหลักสูตร สำเร็จ 4 บทเรียนขึ้นไป',
      iconName: 'Compass',
      category: 'milestone',
      unlocked: completedLessons.length >= 4,
      progress: Math.min(completedLessons.length, 4),
      maxProgress: 4,
    },
    {
      id: 'mindful_journaler',
      title: 'นักบันทึกความรู้สึก',
      englishTitle: 'Artful Journaler',
      description: 'เขียนบันทึกย่อส่วนตัวในสมุดประจำบทเรียนอย่างน้อย 3 บท',
      iconName: 'BookOpen',
      category: 'habit',
      unlocked: notesCount >= 3,
      progress: Math.min(notesCount, 3),
      maxProgress: 3,
    },
    {
      id: 'gallery_collector',
      title: 'นักสะสมผลงาน',
      englishTitle: 'Gallery Curator',
      description: 'ส่งผลงานที่ผ่านการประเมินจากครูเข้าสู่อัลบั้มแกลเลอรีอย่างน้อย 3 ชิ้น',
      iconName: 'Image',
      category: 'habit',
      unlocked: submissions.length >= 3,
      progress: Math.min(submissions.length, 3),
      maxProgress: 3,
    },
    {
      id: 'course_graduate',
      title: 'บัณฑิตสีน้ำมือโปร',
      englishTitle: 'Grand Watercolor Graduate',
      description: 'สำเร็จหลักสูตรครบทั้ง 8 บทเรียน (บทที่ 0 ถึง บทที่ 7) รับใบประกาศนียบัตร',
      iconName: 'Crown',
      category: 'milestone',
      unlocked: allEightDone,
      progress: completedLessons.length,
      maxProgress: 8,
    },
  ];
}
