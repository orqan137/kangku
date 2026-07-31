import {SemesterCourse, SemesterCourseInput, Weekday} from '../types';

export const WEEKDAYS: {key: Weekday; short: string; label: string}[] = [
  {key: 'mon', short: '월', label: '월요일'},
  {key: 'tue', short: '화', label: '화요일'},
  {key: 'wed', short: '수', label: '수요일'},
  {key: 'thu', short: '목', label: '목요일'},
  {key: 'fri', short: '금', label: '금요일'},
];

export const COURSE_COLORS = [
  '#F4A6BD',
  '#B8A3E4',
  '#83CDA6',
  '#F2CB6B',
  '#87BCEB',
] as const;

export function getCurrentSemesterKey(date = new Date()) {
  const month = date.getMonth();
  const academicYear = month < 2 ? date.getFullYear() - 1 : date.getFullYear();
  const term = month >= 2 && month < 8 ? 1 : 2;
  return `${academicYear}-${term}`;
}

export function formatSemesterLabel(semester: string) {
  const [year, term] = semester.split('-');
  return `${year}년 ${term}학기`;
}

export function getWeekdayKey(date = new Date()): Weekday | undefined {
  return (
    {
      1: 'mon',
      2: 'tue',
      3: 'wed',
      4: 'thu',
      5: 'fri',
    } as const
  )[date.getDay() as 1 | 2 | 3 | 4 | 5];
}

export function timeToMinutes(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) {
    return undefined;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function validateSemesterCourse(input: SemesterCourseInput) {
  if (!input.title.trim()) {
    return '과목명을 입력해 주세요.';
  }
  if (!input.days.length) {
    return '수업 요일을 하나 이상 선택해 주세요.';
  }
  const start = timeToMinutes(input.startTime);
  const end = timeToMinutes(input.endTime);
  if (start === undefined || end === undefined) {
    return '시간은 09:00 형식으로 입력해 주세요.';
  }
  if (start >= end) {
    return '종료 시간은 시작 시간보다 늦어야 해요.';
  }
  return undefined;
}

export function coursesOverlap(
  left: Pick<
    SemesterCourse,
    'semester' | 'days' | 'startTime' | 'endTime'
  >,
  right: Pick<
    SemesterCourseInput,
    'semester' | 'days' | 'startTime' | 'endTime'
  >,
) {
  if (left.semester !== right.semester) {
    return false;
  }
  if (!left.days.some(day => right.days.includes(day))) {
    return false;
  }
  const leftStart = timeToMinutes(left.startTime);
  const leftEnd = timeToMinutes(left.endTime);
  const rightStart = timeToMinutes(right.startTime);
  const rightEnd = timeToMinutes(right.endTime);
  if (
    leftStart === undefined ||
    leftEnd === undefined ||
    rightStart === undefined ||
    rightEnd === undefined
  ) {
    return false;
  }
  return leftStart < rightEnd && rightStart < leftEnd;
}

export function sortSemesterCourses(courses: SemesterCourse[]) {
  return [...courses].sort((left, right) => {
    const leftDay = Math.min(
      ...left.days.map(day => WEEKDAYS.findIndex(item => item.key === day)),
    );
    const rightDay = Math.min(
      ...right.days.map(day => WEEKDAYS.findIndex(item => item.key === day)),
    );
    return leftDay - rightDay || left.startTime.localeCompare(right.startTime);
  });
}
