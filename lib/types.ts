export type Course = { id: string; name: string; color?: string };
export type Lecture = {
  id: string; courseId: string; title: string; instructor: string;
  date: string; startTime: string; endTime: string; meetUrl: string;
  description?: string; status?: 'scheduled' | 'cancelled';
};
export type TimetableData = { timezone: 'Asia/Kolkata'; courses: Course[]; lectures: Lecture[] };
