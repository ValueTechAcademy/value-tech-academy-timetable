'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CalendarDays,
  Clock3,
  Video,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import type { TimetableData, Lecture } from '@/lib/types';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

const empty: TimetableData = {
  timezone: 'Asia/Kolkata',
  courses: [],
  lectures: [],
};

const todayISO = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const dateLabel = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-IN', {
    ...opts,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(`${date}T12:00:00+05:30`));

const timeLabel = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);

  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(d);
};

function statusOf(l: Lecture, today: string) {
  if (l.status === 'cancelled') return 'Cancelled';
  if (l.date < today) return 'Completed';
  if (l.date > today) return 'Upcoming';

  const now = new Date();
  const local = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);

  return local < l.startTime ? 'Upcoming' : local <= l.endTime ? 'Live' : 'Completed';
}

export default function Timetable() {
  const [data, setData] = useState<TimetableData>(empty);
  const [loaded, setLoaded] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(todayISO());
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetch(`${BASE}/timetable.json`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(empty))
      .finally(() => setLoaded(true));
  }, []);

  const today = todayISO();
  const sorted = [...data.lectures]
    .filter((l) => l.status !== 'cancelled')
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  const courseName = (id: string) => data.courses.find((c) => c.id === id)?.name || 'Course';
  const todays = sorted.filter((l) => l.date === today);
  const selectedLectures = sorted.filter((l) => l.date === selected);

  const startOfWeek = useMemo(() => {
    const d = new Date(`${today}T12:00:00+05:30`);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day + weekOffset * 7);
    return d;
  }, [today, weekOffset]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  });

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = monthStart.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const monthCells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => {
    const n = i - offset + 1;
    return n > 0 && n <= days ? n : null;
  });

  const hasClass = (date: string) => sorted.some((l) => l.date === date);

  return (
    <main className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <Image
            src={`${BASE}/logo.png`}
            alt="Value Tech Academy"
            width={430}
            height={122}
            priority
          />
        </Link>

        <div className="headerRight">
          <span className="todayPill">
            <CalendarDays size={16} /> {dateLabel(today, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>

          <a className="navActive" href="#timetable">
            Timetable
          </a>

          <Link className="adminLink" href="/admin/">
            Admin editor <ShieldCheck size={15} />
          </Link>
        </div>
      </header>

      <section className="intro">
        <div>
          <h1>
            Online Class <span>Timetable</span>
          </h1>
          <p className="sub">Your learning schedule, all in one place.</p>
        </div>
      </section>

      <section className="dashboard" id="timetable">
        <article className="panel todayPanel">
          <div className="panelHead">
            <div>
              <p className="eyebrow">YOUR SCHEDULE</p>
              <h2>Today's Lectures</h2>
            </div>
            <span className="countBadge">
              {todays.length} {todays.length === 1 ? 'class' : 'classes'}
            </span>
          </div>

          <p className="dateLine">
            {dateLabel(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          {!loaded ? (
            <p className="empty">Loading timetable…</p>
          ) : todays.length === 0 ? (
            <div className="emptyState">
              <CalendarDays size={30} />
              <strong>No lectures scheduled today</strong>
              <span>Check the weekly or monthly timetable for upcoming classes.</span>
            </div>
          ) : (
            <div className="lectureList">
              {todays.map((l) => (
                <LectureCard key={l.id} lecture={l} course={courseName(l.courseId)} />
              ))}
            </div>
          )}
        </article>

        <article className="panel weekPanel">
          <div className="panelHead">
            <div>
              <p className="eyebrow">PLAN AHEAD</p>
              <h2>Weekly Timetable</h2>
            </div>

            <div className="weekControls">
              <button aria-label="Previous week" onClick={() => setWeekOffset((v) => v - 1)}>
                <ChevronLeft />
              </button>
              <button aria-label="Next week" onClick={() => setWeekOffset((v) => v + 1)}>
                <ChevronRight />
              </button>
            </div>
          </div>

          <div className="weekRange">
            {dateLabel(weekDays[0], { day: 'numeric', month: 'short' })} –{' '}
            {dateLabel(weekDays[6], { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
            <button onClick={() => setWeekOffset(0)}>This week</button>
          </div>

          <div className="weekGrid">
            {weekDays.map((d, i) => {
              const classes = sorted.filter((l) => l.date === d);

              return (
                <div className={`dayColumn ${d === today ? 'isToday' : ''}`} key={d}>
                  <button className="dayHead" onClick={() => setSelected(d)}>
                    <span>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                    <b>{dateLabel(d, { day: 'numeric' })}</b>
                  </button>

                  <div className="dayEvents">
                    {classes.length ? (
                      classes.map((l) => (
                        <button className="miniEvent" key={l.id} onClick={() => setSelected(d)}>
                          <b>{courseName(l.courseId)}</b>
                          <span>{timeLabel(l.startTime)}</span>
                        </button>
                      ))
                    ) : (
                      <span className="noClass">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="panel monthPanel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">FULL OVERVIEW</p>
            <h2>Monthly Timetable</h2>
          </div>

          <div className="monthControls">
            <button
              aria-label="Previous month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            >
              <ChevronLeft />
            </button>
            <strong>{new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(month)}</strong>
            <button
              aria-label="Next month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              <ChevronRight />
            </button>
          </div>
        </div>

        <div className="calendarGrid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div className="calendarWeekday" key={d}>
              {d}
            </div>
          ))}

          {monthCells.map((n, i) => {
            if (!n) return <div className="calendarCell blank" key={`blank-${i}`} />;

            const d = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
            const events = sorted.filter((l) => l.date === d);

            return (
              <button
                key={d}
                className={`calendarCell ${d === selected ? 'selected' : ''} ${d === today ? 'todayCell' : ''}`}
                onClick={() => setSelected(d)}
              >
                <span className="cellNumber">{n}</span>
                {events.length > 0 && (
                  <>
                    <span className="eventDot" />
                    <span className="eventCount">
                      {events.length} {events.length === 1 ? 'class' : 'classes'}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <div className="selectedDay">
          <div>
            <p className="eyebrow">SELECTED DATE</p>
            <h3>{dateLabel(selected, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
          </div>
          <span className="countBadge">{selectedLectures.length} classes</span>
        </div>

        {selectedLectures.length ? (
          <div className="selectedList">
            {selectedLectures.map((l) => (
              <LectureCard key={l.id} lecture={l} course={courseName(l.courseId)} />
            ))}
          </div>
        ) : (
          <p className="emptyInline">No classes scheduled for this date.</p>
        )}
      </section>

      <footer>
        <span>© {new Date().getFullYear()} Value Tech Academy</span>
        <span>Learn. Build. Create Value.</span>
      </footer>
    </main>
  );
}

function LectureCard({ lecture, course }: { lecture: Lecture; course: string }) {
  const state = statusOf(lecture, todayISO());

  return (
    <div className="lectureCard">
      <div className="lectureTime">
        <Clock3 size={15} />
        <strong>
          {timeLabel(lecture.startTime)} – {timeLabel(lecture.endTime)}
        </strong>
      </div>

      <div className="lectureInfo">
        <div className="lectureTitleRow">
          <h3>{lecture.title || course}</h3>
          <span className={`status ${state.toLowerCase()}`}>{state}</span>
        </div>

        <p>
          {course}
          {lecture.instructor ? ` · ${lecture.instructor}` : ''}
        </p>

        {lecture.description && <small>{lecture.description}</small>}
      </div>

      {lecture.meetUrl ? (
        <a className="joinButton" href={lecture.meetUrl} target="_blank" rel="noreferrer">
          <Video size={16} /> Join Meet <ExternalLink size={13} />
        </a>
      ) : (
        <span className="noMeet">Meet link not added</span>
      )}
    </div>
  );
}
