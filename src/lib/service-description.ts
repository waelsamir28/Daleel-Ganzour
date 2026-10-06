const specialtyDescriptions: Record<string, string[]> = {
  law: [
    "استشارات قانونية ومتابعة القضايا وصياغة العقود، مع توضيح الإجراءات المناسبة لكل حالة.",
    "خدمات المحاماة والاستشارات القانونية، ومراجعة العقود ومتابعة الإجراءات والقضايا.",
    "مساعدة قانونية في الاستشارات وصياغة العقود ومتابعة القضايا والإجراءات الرسمية.",
  ],
  pharmacies: [
    "صيدلية لتوفير الأدوية والمستلزمات الطبية، مع إمكانية السؤال عن توافر الأصناف قبل الزيارة.",
    "خدمات صيدلانية وأدوية ومستلزمات طبية لأهل جنزور. يُرجى التواصل للتأكد من توافر الدواء.",
    "صيدلية لخدمتكم بالأدوية ومنتجات العناية والمستلزمات الطبية، مع الاستفسار هاتفيًا عن التوافر.",
  ],
  "medical-labs": [
    "تحاليل طبية وخدمات سحب العينات، مع التواصل لمعرفة الفحوصات المتاحة ومواعيد العمل.",
    "معمل تحاليل طبية لإجراء الفحوصات ومتابعة النتائج، ويُرجى الاتصال للاستفسار عن المواعيد.",
    "خدمات الفحوصات والتحاليل الطبية لأهل جنزور، مع إمكانية الاستفسار عن التحاليل المطلوبة.",
  ],
  family: [
    "رعاية طب الأسرة والباطنة، ومتابعة الحالات الصحية والفحوصات الدورية بعد حجز موعد.",
    "استشارات ومتابعة في طب الأسرة والباطنة، مع التواصل لمعرفة مواعيد الكشف والخدمات المتاحة.",
    "خدمات طبية للأسرة والباطنة تشمل المتابعة الصحية والفحوصات، ويُرجى الاتصال قبل الزيارة.",
  ],
};

function stableIndex(value: string, length: number) {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % length;
}

export function serviceDescription(categoryId: string, categoryName: string, seed = "") {
  const options = specialtyDescriptions[categoryId];
  if (options) return options[stableIndex(seed || categoryId, options.length)];
  const variations = [
    `خدمات ${categoryName} لأهل جنزور، مع التواصل لمعرفة التفاصيل ومواعيد تقديم الخدمة.`,
    `متخصص في ${categoryName} وتقديم الخدمات المرتبطة بها داخل جنزور. اتصل للاستفسار والتنسيق.`,
    `خدمات مهنية في مجال ${categoryName}، مع إمكانية التواصل لمعرفة التفاصيل وترتيب الخدمة.`,
  ];
  return variations[stableIndex(seed || categoryId, variations.length)];
}

export function categoryServiceDescription(categoryId: string, categoryName: string, seed = "") {
  const options = specialtyDescriptions[categoryId];
  return options ? options[stableIndex(seed || categoryId, options.length)] : serviceDescription(categoryId, categoryName, seed);
}

export function specialtyDescriptionOptions(categoryId: string, categoryName: string) {
  return specialtyDescriptions[categoryId] ?? [
    `خدمات ${categoryName} لأهل جنزور، مع التواصل لمعرفة التفاصيل ومواعيد تقديم الخدمة.`,
    `متخصص في ${categoryName} وتقديم الخدمات المرتبطة بها داخل جنزور. اتصل للاستفسار والتنسيق.`,
    `خدمات مهنية في مجال ${categoryName}، مع إمكانية التواصل لمعرفة التفاصيل وترتيب الخدمة.`,
  ];
}

export function serviceDescriptionVariant(categoryId: string, categoryName: string, seed = "") {
  const options = specialtyDescriptionOptions(categoryId, categoryName);
  return options[stableIndex(seed || categoryId, options.length)];
}
