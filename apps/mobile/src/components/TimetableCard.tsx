import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {SemesterCourse} from '../types';
import {
  getWeekdayKey,
  timeToMinutes,
  WEEKDAYS,
} from '../utils/semester';
import {colors, fonts, softShadow} from '../theme';
import {AppText} from './ui';

const START_MINUTES = 8 * 60;
const END_MINUTES = 19 * 60;
const TOTAL_MINUTES = END_MINUTES - START_MINUTES;
const HOUR_MARKS = [8, 10, 12, 14, 16, 18];

export function TimetableCard({
  courses,
  compact = false,
  onCoursePress,
}: {
  courses: SemesterCourse[];
  compact?: boolean;
  onCoursePress?: (course: SemesterCourse) => void;
}) {
  const bodyHeight = compact ? 248 : 310;
  const today = getWeekdayKey();

  if (!courses.length) {
    return (
      <View style={[styles.empty, softShadow]}>
        <AppText style={styles.emptyIcon}>📅</AppText>
        <View style={styles.emptyCopy}>
          <AppText style={styles.emptyTitle}>아직 등록한 시간표가 없어요</AppText>
          <AppText style={styles.emptyBody}>
            마이페이지에서 이번 학기 강의를 추가해 보세요.
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, softShadow]}>
      <View style={styles.header}>
        <View style={styles.timeHeader} />
        {WEEKDAYS.map(day => (
          <View
            key={day.key}
            style={[
              styles.dayHeader,
              day.key === today && styles.todayHeader,
            ]}>
            <AppText
              style={[
                styles.dayHeaderText,
                day.key === today && styles.todayHeaderText,
              ]}>
              {day.short}
            </AppText>
          </View>
        ))}
      </View>

      <View style={[styles.body, {height: bodyHeight}]}>
        {HOUR_MARKS.map(hour => {
          const top =
            ((hour * 60 - START_MINUTES) / TOTAL_MINUTES) * bodyHeight;
          return (
            <React.Fragment key={hour}>
              <AppText style={[styles.hour, {top: top - 7}]}>
                {hour}
              </AppText>
              <View style={[styles.gridLine, {top}]} />
            </React.Fragment>
          );
        })}

        <View style={styles.columns}>
          {WEEKDAYS.map(day => (
            <View
              key={day.key}
              style={[
                styles.column,
                day.key === today && styles.todayColumn,
              ]}>
              {courses
                .filter(course => course.days.includes(day.key))
                .map(course => {
                  const start = timeToMinutes(course.startTime) ?? START_MINUTES;
                  const end = timeToMinutes(course.endTime) ?? start + 60;
                  const top =
                    ((Math.max(start, START_MINUTES) - START_MINUTES) /
                      TOTAL_MINUTES) *
                    bodyHeight;
                  const height = Math.max(
                    34,
                    ((Math.min(end, END_MINUTES) -
                      Math.max(start, START_MINUTES)) /
                      TOTAL_MINUTES) *
                      bodyHeight,
                  );
                  return (
                    <Pressable
                      key={`${course.id}-${day.key}`}
                      disabled={!onCoursePress}
                      onPress={() => onCoursePress?.(course)}
                      style={({pressed}) => [
                        styles.course,
                        {
                          top: top + 2,
                          height: height - 4,
                          backgroundColor: course.color,
                        },
                        pressed && styles.pressed,
                      ]}>
                      <AppText
                        numberOfLines={compact ? 2 : 3}
                        style={[
                          styles.courseTitle,
                          compact && styles.courseTitleCompact,
                        ]}>
                        {course.title}
                      </AppText>
                      {!compact ? (
                        <AppText numberOfLines={1} style={styles.courseRoom}>
                          {course.room}
                        </AppText>
                      ) : null}
                    </Pressable>
                  );
                })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EADFE2',
    backgroundColor: colors.paper,
  },
  header: {
    height: 42,
    flexDirection: 'row',
    paddingLeft: 33,
    backgroundColor: '#FFF9F7',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  timeHeader: {
    position: 'absolute',
    left: 0,
    width: 33,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayHeader: {
    backgroundColor: colors.pinkSoft,
  },
  dayHeaderText: {
    fontFamily: fonts.display,
    color: colors.text,
    fontSize: 11,
  },
  todayHeaderText: {
    color: colors.pinkDark,
  },
  body: {
    position: 'relative',
    paddingLeft: 33,
  },
  hour: {
    position: 'absolute',
    left: 7,
    width: 22,
    fontFamily: fonts.display,
    fontSize: 8,
    lineHeight: 14,
    textAlign: 'right',
    color: '#8D838D',
  },
  gridLine: {
    position: 'absolute',
    left: 33,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EFE6E7',
  },
  columns: {
    flex: 1,
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    position: 'relative',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#EFE6E7',
  },
  todayColumn: {
    backgroundColor: 'rgba(251,220,230,.18)',
  },
  course: {
    position: 'absolute',
    left: 2,
    right: 2,
    minHeight: 34,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.62)',
    overflow: 'hidden',
  },
  courseTitle: {
    fontFamily: fonts.display,
    fontSize: 9,
    lineHeight: 12,
    color: '#514A55',
  },
  courseTitleCompact: {
    fontSize: 8,
    lineHeight: 10,
  },
  courseRoom: {
    marginTop: 2,
    fontWeight: '600',
    fontSize: 7,
    lineHeight: 10,
    color: 'rgba(81,74,85,.88)',
  },
  pressed: {
    opacity: 0.72,
    transform: [{scale: 0.97}],
  },
  empty: {
    minHeight: 104,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 34,
    lineHeight: 42,
  },
  emptyCopy: {
    flex: 1,
    marginLeft: 13,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.ink,
  },
  emptyBody: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
    color: colors.text,
    marginTop: 3,
  },
});
