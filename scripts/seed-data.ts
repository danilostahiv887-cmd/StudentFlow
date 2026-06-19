import type { Activity, Application, Badge, Category, Club, DatabaseSnapshot, Group, MediaAsset, ParticipationReport, Profile, Speciality, StudentBadge } from '../src/types/entities';

export const seedPasswords = {
  admin: 'DmtfkAdmin-2026!',
  teacher: 'MentorRoute-2026!',
  student: 'StudentRoute-2026!',
};

type HashFn = (password: string) => Promise<string>;

const categoryRows: Category[] = [
  { id: 'cat-research', name: 'Дослідження', slug: 'doslidzhennia', color: 'violet', imageKey: 1 },
  { id: 'cat-prototype', name: 'Прототипування', slug: 'prototypuvannia', color: 'aqua', imageKey: 2 },
  { id: 'cat-balance', name: 'Баланс', slug: 'balans', color: 'coral', imageKey: 3 },
  { id: 'cat-media', name: 'Медіа', slug: 'media', color: 'lime', imageKey: 4 },
  { id: 'cat-leadership', name: 'Лідерство', slug: 'liderstvo', color: 'violet', imageKey: 5 },
  { id: 'cat-career', name: 'Кар’єра', slug: 'kariera', color: 'aqua', imageKey: 6 },
  { id: 'cat-communication', name: 'Комунікація', slug: 'komunikatsiia', color: 'coral', imageKey: 7 },
];

const specialityRows: Speciality[] = [
  { id: 'spec-pk', code: 'ПК', name: 'Програмування комп’ютерних систем', description: 'Розробка програмних продуктів, баз даних і вебсервісів.' },
  { id: 'spec-ek', code: 'ЕК', name: 'Економіка та комерція', description: 'Фінансова аналітика, підприємництво й комерційні процеси.' },
  { id: 'spec-or', code: 'ОР', name: 'Організація роботи', description: 'Координація процесів, менеджмент команд і операційні рішення.' },
  { id: 'spec-dz', code: 'ДЗ', name: 'Дизайн цифрових продуктів', description: 'Візуальні системи, інтерфейси та медійні матеріали.' },
  { id: 'spec-dv', code: 'ДВ', name: 'Діловодство та візуальні комунікації', description: 'Документообіг, презентації та комунікаційні матеріали.' },
];

const groupCodes = ['11', '12', '21', '22', '31', '32', '41', '42'];
const startByCourse: Record<string, number> = { '1': 2025, '2': 2024, '3': 2023, '4': 2022 };

function slug(value: string) {
  return value.toLocaleLowerCase('uk-UA').replace(/[^a-zа-яіїєґ0-9]+/gi, '-').replace(/^-|-$/g, '');
}

function buildGroups() {
  const groups: Group[] = [];
  for (const speciality of specialityRows) {
    for (const code of groupCodes) {
      const startYear = startByCourse[code[0]] ?? 2025;
      const endYear = startYear + 4;
      groups.push({ id: `group-${speciality.code.toLocaleLowerCase()}-${code}`, name: `${speciality.code}-${code} (${startYear}-${endYear})`, specialityId: speciality.id, startYear, endYear, isActive: true });
    }
  }
  return groups;
}

const teacherNames = [
  ['teacher-1', 'Олена Левченко', 'olena.levchenko@studentflow.edu.ua'],
  ['teacher-2', 'Андрій Мельник', 'andrii.melnyk@studentflow.edu.ua'],
  ['teacher-3', 'Наталія Гринь', 'nataliia.hryn@studentflow.edu.ua'],
  ['teacher-4', 'Ірина Кравченко', 'iryna.kravchenko@studentflow.edu.ua'],
  ['teacher-5', 'Сергій Литвин', 'serhii.lytvyn@studentflow.edu.ua'],
  ['teacher-6', 'Марина Шевчук', 'maryna.shevchuk@studentflow.edu.ua'],
] as const;

const studentNames = [
  ['student-1', 'Іван Бондар', 'ivan.bondar@studentflow.edu.ua'],
  ['student-2', 'Софія Петренко', 'sofiia.petrenko@studentflow.edu.ua'],
  ['student-3', 'Максим Кравець', 'maksym.kravets@studentflow.edu.ua'],
  ['student-4', 'Дарина Романюк', 'daryna.romaniuk@studentflow.edu.ua'],
  ['student-5', 'Тарас Бойко', 'taras.boiko@studentflow.edu.ua'],
  ['student-6', 'Лілія Савчук', 'liliia.savchuk@studentflow.edu.ua'],
  ['student-7', 'Олег Мороз', 'oleh.moroz@studentflow.edu.ua'],
  ['student-8', 'Анна Черненко', 'anna.chernenko@studentflow.edu.ua'],
  ['student-9', 'Дмитро Савенко', 'dmytro.savenko@studentflow.edu.ua'],
  ['student-10', 'Катерина Лисенко', 'kateryna.lysenko@studentflow.edu.ua'],
  ['student-11', 'Роман Федорів', 'roman.fedoriv@studentflow.edu.ua'],
  ['student-12', 'Вікторія Павлюк', 'viktoriia.pavliuk@studentflow.edu.ua'],
  ['student-13', 'Назар Ільницький', 'nazar.ilnytskyi@studentflow.edu.ua'],
  ['student-14', 'Юлія Марченко', 'yuliia.marchenko@studentflow.edu.ua'],
  ['student-15', 'Богдан Клим', 'bohdan.klym@studentflow.edu.ua'],
  ['student-16', 'Марія Гончар', 'mariia.honchar@studentflow.edu.ua'],
  ['student-17', 'Павло Руденко', 'pavlo.rudenko@studentflow.edu.ua'],
  ['student-18', 'Вероніка Ткач', 'veronika.tkach@studentflow.edu.ua'],
] as const;

const clubRows: Club[] = [
  { id: 'club-research', name: 'Дослідницький стіл', slug: 'doslidnytskyi-stil', description: 'Малі дослідження, аналітика й академічна аргументація.', teacherId: 'teacher-1', imageKey: 1, status: 'active' },
  { id: 'club-prototype', name: 'Студія прототипів', slug: 'studiia-prototypiv', description: 'Спринти, прототипи та продуктове мислення.', teacherId: 'teacher-2', imageKey: 2, status: 'active' },
  { id: 'club-balance', name: 'Центр балансу', slug: 'tsentr-balansu', description: 'Енергія, командна стійкість і здоровий ритм навчання.', teacherId: 'teacher-3', imageKey: 3, status: 'active' },
  { id: 'club-media', name: 'Медіамайстерня', slug: 'mediamaisternia', description: 'Медіаартефакти, портфоліо й візуальні історії.', teacherId: 'teacher-4', imageKey: 4, status: 'active' },
  { id: 'club-leadership', name: 'Кімната командних рішень', slug: 'kimnata-komandnykh-rishen', description: 'Лідерські симуляції, фасилітація та командні сценарії.', teacherId: 'teacher-5', imageKey: 5, status: 'active' },
  { id: 'club-career', name: 'Кар’єрна майстерня', slug: 'karierna-maisternia', description: 'Портфоліо, стажування, співбесіди та професійний профіль.', teacherId: 'teacher-6', imageKey: 6, status: 'active' },
  { id: 'club-communication', name: 'Лабораторія виступів', slug: 'laboratoriia-vystupiv', description: 'Презентації, дискусії, переговори та публічні виступи.', teacherId: 'teacher-1', imageKey: 7, status: 'active' },
];

const activityTemplates: Record<string, [string, string, string[]][]> = {
  'cat-research': [
    ['Картка міні-дослідження', 'Одна гіпотеза, малі дані та висновок у структурованій картці.', ['Дослідження', 'Дані', 'Аргументація']],
    ['Лабораторія опитування користувачів', 'Планування короткого опитування, збір відповідей і висновки.', ['Інтерв’ю', 'Методологія', 'Висновки']],
    ['День відкритих даних коледжу', 'Побудова простого набору даних для рішення навчальної проблеми.', ['Дані', 'Візуалізація', 'Критичне мислення']],
    ['Огляд джерел для проєкту', 'Пошук, оцінка і коротке порівняння джерел для курсової або pet-проєкту.', ['Пошук інформації', 'Академічна доброчесність', 'Структура']],
    ['Мініконференція студентських ідей', 'Коротка доповідь про власне спостереження, прототип або дослідницьке питання.', ['Виступ', 'Дослідження', 'Фідбек']],
  ],
  'cat-prototype': [
    ['Спринт прототипу за 6 годин', 'Стисла продуктова задача, роль у команді та клікабельний результат.', ['Прототипування', 'Командна робота', 'Презентація']],
    ['Швидкий макет сервісу', 'Створення low-code або Figma-макета студентського сервісу.', ['Макетування', 'UX', 'Командна робота']],
    ['Технічна розбірка ідеї', 'Перевірка реалізовності ідеї через карту функцій, ризиків і залежностей.', ['Системне мислення', 'Архітектура', 'Оцінка ризиків']],
    ['API-майстерня для початківців', 'Проєктування простого API-контракту для навчального продукту.', ['API', 'Документація', 'Логіка']],
    ['Демо-день прототипів', 'Показ прототипу, збір фідбеку і план наступної ітерації.', ['Демонстрація', 'Фідбек', 'Ітерація']],
  ],
  'cat-balance': [
    ['Перезавантаження командної енергії', 'Практика планування навантаження й коротка командна ретроспектива.', ['Самоменеджмент', 'Стійкість', 'Рефлексія']],
    ['Особистий навчальний ритм', 'Планування тижня з контрольними точками для проєктів і відпочинку.', ['Планування', 'Фокус', 'Рефлексія']],
    ['Командна ретроспектива без конфліктів', 'Формат обговорення складних моментів без персональних звинувачень.', ['Емпатія', 'Комунікація', 'Стійкість']],
    ['Майстерня концентрації', 'Техніки роботи з відволіканнями під час навчальних спринтів.', ['Фокус', 'Самоменеджмент', 'Навчання']],
    ['Карта ресурсів студента', 'Визначення сильних сторін, обмежень і джерел підтримки.', ['Самооцінка', 'Планування', 'Баланс']],
  ],
  'cat-media': [
    ['Медіадоказ за 60 секунд', 'Короткий медіаартефакт для портфоліо без зайвого монтажу.', ['Сторітелінг', 'Медіа', 'Самопрезентація']],
    ['Фотоісторія навчального проєкту', 'Побудова послідовної візуальної історії про процес і результат.', ['Фото', 'Сторітелінг', 'Композиція']],
    ['Редакція студентського допису', 'Підготовка короткого тексту для сайту або соціальної сторінки коледжу.', ['Редагування', 'Тон голосу', 'Структура']],
    ['Відеоогляд командної роботи', 'Сценарій і монтаж короткого огляду командного результату.', ['Відео', 'Сценарій', 'Монтаж']],
    ['Портфоліо-вітрина', 'Оформлення одного артефакту так, щоб його можна було показати ментору або роботодавцю.', ['Портфоліо', 'Дизайн', 'Самопрезентація']],
  ],
  'cat-leadership': [
    ['Кімната рішень', 'Розбір складної командної ситуації з картою рішень.', ['Лідерство', 'Емпатія', 'Прийняття рішень']],
    ['Фасилітація командної зустрічі', 'Практика ролі модератора для короткої робочої зустрічі.', ['Фасилітація', 'Комунікація', 'Час']],
    ['Карта відповідальності в команді', 'Розподіл ролей і домовленостей для навчального проєкту.', ['Відповідальність', 'Команда', 'Планування']],
    ['Конфлікт як робоча ситуація', 'Розбір конфліктної ситуації через факти, потреби й рішення.', ['Емпатія', 'Рішення', 'Комунікація']],
    ['Лідерський кейс від студентради', 'Симуляція рішення для реальної студентської ініціативи.', ['Лідерство', 'Організація', 'Публічність']],
  ],
  'cat-career': [
    ['Профіль для стажування', 'Резюме, портфоліо й короткий опис ролі в одному пакеті.', ['Кар’єра', 'Самопрезентація', 'Портфоліо']],
    ['Симуляція першої співбесіди', 'Коротка співбесіда з фідбеком щодо відповідей і прикладів.', ['Співбесіда', 'Комунікація', 'Підготовка']],
    ['Опис проєкту для резюме', 'Перетворення навчальної роботи на зрозумілий професійний опис.', ['Резюме', 'Структура', 'Портфоліо']],
    ['Пошук стажування без хаосу', 'Фільтрація вакансій, вимог і план подання заявки.', ['Пошук', 'Кар’єра', 'Планування']],
    ['Кар’єрна ревізія портфоліо', 'Перевірка прогалин і вибір двох наступних доказів.', ['Портфоліо', 'Самооцінка', 'Планування']],
  ],
  'cat-communication': [
    ['Виступ за 90 секунд', 'Короткий виступ, запис і точковий фідбек за структурою.', ['Публічний виступ', 'Структура', 'Комунікація']],
    ['Коротке оновлення англійською', 'Робоче оновлення англійською з фідбеком.', ['Англійська мова', 'Комунікація', 'Самопрезентація']],
    ['Дебатна пара', 'Аргументація позиції в парі з обмеженим часом.', ['Аргументація', 'Слухання', 'Публічність']],
    ['Переговори про командні умови', 'Моделювання розмови про дедлайни, ролі та очікування.', ['Переговори', 'Емпатія', 'Домовленості']],
    ['Презентація технічного рішення', 'Пояснення складного рішення простою мовою для не технічної аудиторії.', ['Пояснення', 'Структура', 'Виступ']],
  ],
};

export async function buildSeed(hashPassword: HashFn, imageBase = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '/seed-images/visuals'): Promise<DatabaseSnapshot> {
  const groups = buildGroups();
  const adminHash = await hashPassword(seedPasswords.admin);
  const teacherHash = await hashPassword(seedPasswords.teacher);
  const studentHash = await hashPassword(seedPasswords.student);
  const profiles: Profile[] = [
    { id: 'admin-1', fullName: 'Стахів Данило', email: 'danylo.stakhiv@studentflow.edu.ua', passwordHash: adminHash, role: 'admin', status: 'active', pointsTotal: 0 },
    ...teacherNames.map(([id, fullName, email]) => ({ id, fullName, email, passwordHash: teacherHash, role: 'teacher' as const, status: 'active' as const, pointsTotal: 0 })),
    ...studentNames.map(([id, fullName, email], index) => {
      const group = groups[index % groups.length];
      return { id, fullName, email, passwordHash: studentHash, role: 'student' as const, status: 'active' as const, groupId: group.id, specialityId: group.specialityId, phone: `+380 67 20${String(index).padStart(2, '0')} ${String(10 + index).padStart(2, '0')} ${String(30 + index).padStart(2, '0')}`, bio: 'Формую портфоліо через практичні кроки, докази та менторський фідбек.', pointsTotal: 0 };
    }),
  ];

  const mediaAssets: MediaAsset[] = Array.from({ length: 8 }, (_, index) => ({ id: `media-activity-${index + 1}`, kind: 'activity', imageKey: index + 1, fileName: `studentflow-activity-${index + 1}.png`, url: `${imageBase.replace(/\/$/, '')}/studentflow-activity-${index + 1}.png`, thumbnailUrl: `${imageBase.replace(/\/$/, '')}/studentflow-activity-${index + 1}.png`, alt: `Візуал маршруту ${index + 1}`, dominantColor: '#48c8d8' }));
  const activities: Activity[] = [];
  let activityIndex = 0;
  for (const category of categoryRows) {
    const club = clubRows.find((item) => item.id.includes(category.id.split('-')[1])) ?? clubRows[activityIndex % clubRows.length];
    for (const [title, shortDescription, skills] of activityTemplates[category.id]) {
      const teacher = teacherNames[activityIndex % teacherNames.length][0];
      const start = new Date(Date.UTC(2026, 6 + Math.floor(activityIndex / 9), 4 + (activityIndex % 24), 9 + (activityIndex % 5), 0, 0));
      const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
      activities.push({ id: `activity-${String(activityIndex + 1).padStart(2, '0')}`, title, slug: `${slug(title)}-${activityIndex + 1}`, shortDescription, description: `${shortDescription} Учасники працюють з конкретним артефактом, отримують фідбек і додають результат до портфоліо.`, categoryId: category.id, clubId: club.id, teacherId: teacher, imageKey: (activityIndex % 8) + 1, format: activityIndex % 3 === 0 ? 'hybrid' : activityIndex % 3 === 1 ? 'offline' : 'online', location: activityIndex % 3 === 2 ? 'Онлайн у StudentFlow' : club.name, startAt: start.toISOString(), endAt: end.toISOString(), maxParticipants: 18 + (activityIndex % 5) * 6, points: 10 + (activityIndex % 5) * 4, difficulty: activityIndex % 4 === 0 ? 'advanced' : activityIndex % 2 === 0 ? 'intermediate' : 'beginner', status: 'published', requirements: 'Підготуйте короткий опис цілі, попередній матеріал або приклад ситуації.', resultDescription: 'До портфоліо додається артефакт, коротка рефлексія і перелік підтверджених компетентностей.', skills });
      activityIndex += 1;
    }
  }

  const applications: Application[] = [];
  const reports: ParticipationReport[] = [];
  const statuses: Application['status'][] = ['approved', 'attended', 'approved', 'attended', 'cancelled'];
  let reportCounter = 1;
  studentNames.forEach(([studentId], studentIndex) => {
    for (let offset = 0; offset < 4; offset += 1) {
      const activity = activities[(studentIndex * 2 + offset) % activities.length];
      const status = statuses[(studentIndex + offset) % statuses.length];
      const applicationId = `application-${studentIndex + 1}-${offset + 1}`;
      applications.push({ id: applicationId, activityId: activity.id, studentId, status, motivation: `Хочу посилити портфоліо через «${activity.title}» і отримати підтверджений доказ результату.`, teacherComment: status === 'cancelled' ? 'Студент переніс участь на інший трек.' : undefined, createdAt: new Date(Date.UTC(2026, 5, 10 + studentIndex, 10, offset)).toISOString(), updatedAt: new Date(Date.UTC(2026, 5, 11 + studentIndex, 10, offset)).toISOString() });
      if (status === 'attended' || (status === 'approved' && offset % 2 === 0)) {
        const reportStatus: ParticipationReport['status'] = status === 'attended' ? 'approved' : (studentIndex + offset) % 3 === 0 ? 'submitted' : 'needs_changes';
        reports.push({ id: `report-${reportCounter++}`, applicationId, activityId: activity.id, studentId, status: reportStatus, reflection: `Під час роботи над «${activity.title}» я підготував/підготувала артефакт, описав/описала рішення і зафіксував/зафіксувала наступні кроки для портфоліо.`, hoursSpent: 2 + ((studentIndex + offset) % 5), skillsGained: activity.skills.slice(0, 3).join(', '), evidenceUrl: `https://studentflow.edu.ua/evidence/${applicationId}`, teacherFeedback: reportStatus === 'approved' ? 'Доказ прийнято: видно результат, роль студента і конкретні компетентності.' : reportStatus === 'needs_changes' ? 'Потрібно додати посилання на фінальний артефакт і коротший висновок.' : undefined, reviewedBy: reportStatus === 'approved' || reportStatus === 'needs_changes' ? activity.teacherId : undefined, createdAt: new Date(Date.UTC(2026, 5, 16 + studentIndex, 12, offset)).toISOString(), updatedAt: new Date(Date.UTC(2026, 5, 17 + studentIndex, 12, offset)).toISOString() });
      }
    }
  });

  for (const report of reports.filter((item) => item.status === 'approved')) {
    const student = profiles.find((item) => item.id === report.studentId);
    const activity = activities.find((item) => item.id === report.activityId);
    if (student && activity) student.pointsTotal += activity.points;
  }

  const badges: Badge[] = [
    { id: 'badge-first-proof', title: 'Перший доказ', description: 'Перший прийнятий доказ у портфоліо.', imageKey: 1, color: 'aqua', conditionType: 'activities', conditionValue: 1, isActive: true },
    { id: 'badge-route-builder', title: 'Будівник маршруту', description: 'Три підтверджені кроки маршруту.', imageKey: 2, color: 'violet', conditionType: 'activities', conditionValue: 3, isActive: true },
    { id: 'badge-research', title: 'Початок досліджень', description: 'Перший доказ у дослідницькому треку.', imageKey: 3, color: 'lime', conditionType: 'category', conditionValue: 1, categoryId: 'cat-research', isActive: true },
    { id: 'badge-100', title: '100 балів', description: 'Сто балів у портфоліо.', imageKey: 4, color: 'coral', conditionType: 'points', conditionValue: 100, isActive: true },
  ];
  const studentBadges: StudentBadge[] = profiles.filter((item) => item.role === 'student' && item.pointsTotal > 0).map((student, index) => ({ id: `student-badge-${index + 1}`, studentId: student.id, badgeId: 'badge-first-proof', unlockedAt: '2026-06-20T09:00:00.000Z' }));

  return { profiles, specialities: specialityRows, groups, mediaAssets, clubs: clubRows, categories: categoryRows, activities, applications, reports, badges, studentBadges };
}
