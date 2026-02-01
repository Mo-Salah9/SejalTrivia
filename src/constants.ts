
import { Category } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'lang',
    name: 'Language',
    nameAr: 'لغة',
    questions: [
      { id: 'l1', text: 'ما هو جمع كلمة "عندليب"؟', options: ['عناديل', 'عنادل', 'عنادلة', 'عنادليب'], correctIndex: 1, points: 200, isSolved: false },
      { id: 'l2', text: 'ما هو مرادف كلمة "الوجيز"؟', options: ['القصير', 'المختصر', 'المفيد', 'البليغ'], correctIndex: 1, points: 200, isSolved: false },
      { id: 'l3', text: 'ما هو ضد كلمة "تفاؤل"؟', options: ['تشاؤم', 'حزن', 'يأس', 'خوف'], correctIndex: 0, points: 400, isSolved: false },
      { id: 'l4', text: 'ما هي اللغة الرسمية في البرازيل؟', options: ['الإسبانية', 'الإنجليزية', 'البرتغالية', 'الفرنسية'], correctIndex: 2, points: 400, isSolved: false },
      { id: 'l5', text: 'من هو صاحب كتاب "العقد الفريد"؟', options: ['الجاحظ', 'ابن عبد ربه', 'المتنبي', 'طه حسين'], correctIndex: 1, points: 600, isSolved: false },
      { id: 'l6', text: 'ما هو أصغر بحر في العالم؟', options: ['بحر مرمرة', 'البحر الأحمر', 'بحر اليابان', 'البحر الأسود'], correctIndex: 0, points: 600, isSolved: false },
    ]
  },
  {
    id: 'sports',
    name: 'Sports',
    nameAr: 'رياضة',
    questions: [
      { id: 's1', text: 'كم عدد لاعبي فريق كرة القدم في الملعب؟', options: ['9', '10', '11', '12'], correctIndex: 2, points: 200, isSolved: false },
      { id: 's2', text: 'في أي مدينة أقيمت أول أولمبياد حديثة؟', options: ['لندن', 'باريس', 'أثينا', 'روما'], correctIndex: 2, points: 200, isSolved: false },
      { id: 's3', text: 'من هو اللاعب الملقب بـ "البرغوث"؟', options: ['رونالدو', 'ميسي', 'نيمار', 'مبابي'], correctIndex: 1, points: 400, isSolved: false },
      { id: 's4', text: 'كم مدة شوط المباراة الواحد في كرة القدم؟', options: ['30 دقيقة', '40 دقيقة', '45 دقيقة', '60 دقيقة'], correctIndex: 2, points: 400, isSolved: false },
      { id: 's5', text: 'ما هي الدولة التي فازت بكأس العالم 2022؟', options: ['فرنسا', 'البرازيل', 'الأرجنتين', 'كرواتيا'], correctIndex: 2, points: 600, isSolved: false },
      { id: 's6', text: 'ما هي الرياضة التي تستخدم فيها كلمة "ضربة ساحقة"؟', options: ['التنس', 'كرة اليد', 'الكرة الطائرة', 'كرة السلة'], correctIndex: 2, points: 600, isSolved: false },
    ]
  },
  {
    id: 'science',
    name: 'Science',
    nameAr: 'علوم',
    questions: [
      { id: 'sc1', text: 'ما هو أسرع حيوان بري؟', options: ['النمر', 'الفهد', 'الأسد', 'الحصان'], correctIndex: 1, points: 200, isSolved: false },
      { id: 'sc2', text: 'ما هو الرمز الكيميائي للماء؟', options: ['CO2', 'O2', 'H2O', 'NaCl'], correctIndex: 2, points: 200, isSolved: false },
      { id: 'sc3', text: 'ما هو كوكب "الأرض" في المجموعة الشمسية من حيث الترتيب؟', options: ['الثاني', 'الثالث', 'الرابع', 'الخامس'], correctIndex: 1, points: 400, isSolved: false },
      { id: 'sc4', text: 'ما هو أكبر عضو في جسم الإنسان؟', options: ['الكبد', 'القلب', 'الجلد', 'الرئتان'], correctIndex: 2, points: 400, isSolved: false },
      { id: 'sc5', text: 'ما هي المادة التي يتكون منها الماس؟', options: ['الأكسجين', 'النيتروجين', 'الكربون', 'الحديد'], correctIndex: 2, points: 600, isSolved: false },
      { id: 'sc6', text: 'ما هو الغاز الأكثر وجوداً في الغلاف الجوي؟', options: ['الأكسجين', 'ثاني أكسيد الكربون', 'النيتروجين', 'الهيدروجين'], correctIndex: 2, points: 600, isSolved: false },
    ]
  },
  {
    id: 'history',
    name: 'History',
    nameAr: 'تاريخ',
    questions: [
      { id: 'h1', text: 'من بنى الأهرامات؟', options: ['اليونانيون', 'الفراعنة', 'الرومان', 'العرب'], correctIndex: 1, points: 200, isSolved: false },
      { id: 'h2', text: 'متى انتهت الحرب العالمية الثانية؟', options: ['1940', '1945', '1950', '1935'], correctIndex: 1, points: 200, isSolved: false },
      { id: 'h3', text: 'من هو مكتشف أمريكا؟', options: ['فاسكو دي غاما', 'كريستوفر كولومبوس', 'ماجلان', 'ابن بطوطة'], correctIndex: 1, points: 400, isSolved: false },
      { id: 'h4', text: 'في أي بلد توجد مدينة البتراء؟', options: ['مصر', 'السعودية', 'الأردن', 'سوريا'], correctIndex: 2, points: 400, isSolved: false },
      { id: 'h5', text: 'ما هي عاصمة الدولة العثمانية قديماً؟', options: ['القاهرة', 'دمشق', 'القسطنطينية', 'بغداد'], correctIndex: 2, points: 600, isSolved: false },
      { id: 'h6', text: 'من هو القائد المسلم الذي فتح الأندلس؟', options: ['صلاح الدين الأيوبي', 'طارق بن زياد', 'خالد بن الوليد', 'عقبة بن نافع'], correctIndex: 1, points: 600, isSolved: false },
    ]
  },
  {
    id: 'quran',
    name: 'Quran',
    nameAr: 'قرآن',
    questions: [
      { id: 'q1', text: 'ما هي أطول سورة في القرآن الكريم؟', options: ['آل عمران', 'النساء', 'البقرة', 'المائدة'], correctIndex: 2, points: 200, isSolved: false },
      { id: 'q2', text: 'كم عدد أجزاء القرآن الكريم؟', options: ['25', '30', '35', '40'], correctIndex: 1, points: 200, isSolved: false },
      { id: 'q3', text: 'ما هي السورة الملقبة بـ "عروس القرآن"؟', options: ['يس', 'الرحمن', 'الواقعة', 'تبارك'], correctIndex: 1, points: 400, isSolved: false },
      { id: 'q4', text: 'ما هي السورة التي لا تبدأ بـ "بسم الله الرحمن الرحيم"؟', options: ['النمل', 'الكهف', 'التوبة', 'يونس'], correctIndex: 2, points: 400, isSolved: false },
      { id: 'q5', text: 'ما هي أقصر سورة في القرآن الكريم؟', options: ['الإخلاص', 'الكوثر', 'الفلق', 'الناس'], correctIndex: 1, points: 600, isSolved: false },
      { id: 'q6', text: 'ما هو اسم خازن الجنة كما ورد؟', options: ['مالك', 'رضوان', 'إسرافيل', 'جبريل'], correctIndex: 1, points: 600, isSolved: false },
    ]
  },
  {
    id: 'general',
    name: 'General',
    nameAr: 'ثقافة عامة',
    questions: [
      { id: 'g1', text: 'ما هو أكبر محيط في العالم؟', options: ['الأطلسي', 'الهادي', 'الهندي', 'المتجمد الشمالي'], correctIndex: 1, points: 200, isSolved: false },
      { id: 'g2', text: 'ما هي عاصمة اليابان؟', options: ['سيول', 'بكين', 'طوكيو', 'كيوتو'], correctIndex: 2, points: 200, isSolved: false },
      { id: 'g3', text: 'ما هو المعدن السائل في درجة حرارة الغرفة؟', options: ['الذهب', 'الفضة', 'الزئبق', 'النحاس'], correctIndex: 2, points: 400, isSolved: false },
      { id: 'g4', text: 'ما هو الطائر الذي يضع أكبر بيضة في العالم؟', options: ['الصقر', 'النعامة', 'البومة', 'الببغاء'], correctIndex: 1, points: 400, isSolved: false },
      { id: 'g5', text: 'في أي قارة تقع مصر؟', options: ['آسيا', 'أفريقيا', 'أوروبا', 'أمريكا الجنوبية'], correctIndex: 1, points: 600, isSolved: false },
      { id: 'g6', text: 'ما هو الحيوان الذي يلقب بـ "سفينة الصحراء"؟', options: ['الحصان', 'الجمل', 'الحمار', 'الغزال'], correctIndex: 1, points: 600, isSolved: false },
    ]
  }
];
