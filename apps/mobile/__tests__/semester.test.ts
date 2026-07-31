import {
  coursesOverlap,
  formatSemesterLabel,
  getCurrentSemesterKey,
  timeToMinutes,
  validateSemesterCourse,
} from '../src/utils/semester';

const baseCourse = {
  semester: '2026-1',
  title: '디지털 마케팅 전략',
  professor: '김하늘 교수',
  room: '경영관 301호',
  days: ['mon', 'wed'] as const,
  startTime: '10:00',
  endTime: '11:30',
  color: '#F4A6BD',
  lectureId: undefined,
};

describe('semester schedule helpers', () => {
  test('uses the Korean academic semester boundary', () => {
    expect(getCurrentSemesterKey(new Date(2026, 6, 29))).toBe('2026-1');
    expect(getCurrentSemesterKey(new Date(2026, 8, 1))).toBe('2026-2');
    expect(getCurrentSemesterKey(new Date(2027, 0, 15))).toBe('2026-2');
    expect(formatSemesterLabel('2026-1')).toBe('2026년 1학기');
  });

  test('parses and validates class times', () => {
    expect(timeToMinutes('10:30')).toBe(630);
    expect(timeToMinutes('25:00')).toBeUndefined();
    expect(validateSemesterCourse({...baseCourse, days: [...baseCourse.days]}))
      .toBeUndefined();
    expect(
      validateSemesterCourse({
        ...baseCourse,
        days: [...baseCourse.days],
        endTime: '09:30',
      }),
    ).toBe('종료 시간은 시작 시간보다 늦어야 해요.');
  });

  test('detects overlap only on shared weekdays in the same semester', () => {
    expect(
      coursesOverlap(
        {...baseCourse, days: [...baseCourse.days]},
        {
          ...baseCourse,
          days: ['wed'],
          startTime: '11:00',
          endTime: '12:00',
        },
      ),
    ).toBe(true);
    expect(
      coursesOverlap(
        {...baseCourse, days: [...baseCourse.days]},
        {
          ...baseCourse,
          days: ['fri'],
          startTime: '11:00',
          endTime: '12:00',
        },
      ),
    ).toBe(false);
  });
});
