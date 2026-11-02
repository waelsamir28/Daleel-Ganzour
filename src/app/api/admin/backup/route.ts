import ExcelJS from "exceljs";
import { getAdminDirectory } from "@/lib/directory";
import { getViewer } from "@/lib/auth";
import { apiError } from "@/lib/inputs";
import { backupFileName, buildBackup, servicesSheetRows } from "@/lib/backup";

export const dynamic = "force-dynamic";

/**
 * نسخة احتياطية كاملة من بيانات الدليل (أدمن فقط).
 * - `?format=json` (الافتراضي): ملف JSON ينفع يُسترجع منه تاني من نفس الشاشة.
 * - `?format=xlsx`: ملف Excel بأربع شيتات (المهن، الأقسام، العناوين، الإعدادات) للمراجعة أو الطباعة.
 */
export async function GET(request: Request) {
  try {
    const viewer = await getViewer();
    if (viewer.role !== "admin") return Response.json({ error: "النسخة الاحتياطية متاحة للأدمن فقط." }, { status: 403 });
    const data = await getAdminDirectory("admin");
    const backup = buildBackup({
      services: data.services,
      categories: data.categories,
      areas: data.areas,
      events: data.events ?? [],
      settings: data.settings as unknown as Record<string, unknown>,
      design: (data.designSettings ?? {}) as unknown as Record<string, unknown>,
      telecom: data.telecomSettings as unknown as Record<string, unknown> | undefined,
      greetings: data.greetingSettings as unknown as Record<string, unknown> | undefined,
      utilities: data.utilityNumbers,
    });
    const format = new URL(request.url).searchParams.get("format") === "xlsx" ? "xlsx" : "json";
    if (format === "json") {
      return new Response(JSON.stringify(backup, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${backupFileName()}.json"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "دليل جنزور";
    workbook.created = new Date();
    const categoryNames = new Map(data.categories.map((category) => [category.id, category.name]));

    const servicesSheet = workbook.addWorksheet("المهن");
    servicesSheet.addRows(servicesSheetRows(backup.data.services, categoryNames));
    servicesSheet.getRow(1).font = { bold: true };
    servicesSheet.columns.forEach((column) => { column.width = 20; });

    const categoriesSheet = workbook.addWorksheet("الأقسام");
    categoriesSheet.addRow(["الاسم", "المعرّف", "القسم الأب", "اللون", "مفعّل", "الترتيب"]);
    for (const category of backup.data.categories) {
      categoriesSheet.addRow([
        String(category.name ?? ""),
        String(category.id ?? ""),
        category.parentId ? categoryNames.get(String(category.parentId)) ?? String(category.parentId) : "قسم رئيسي",
        String(category.color ?? ""),
        category.active === false ? "لا" : "نعم",
        Number(category.sortOrder ?? 0),
      ]);
    }
    categoriesSheet.getRow(1).font = { bold: true };

    const areasSheet = workbook.addWorksheet("العناوين");
    areasSheet.addRow(["العنوان", "عدد الخدمات"]);
    for (const area of backup.data.areas) {
      areasSheet.addRow([area, backup.data.services.filter((service) => String(service.area ?? "") === area).length]);
    }
    areasSheet.getRow(1).font = { bold: true };

    const settingsSheet = workbook.addWorksheet("الإعدادات");
    settingsSheet.addRow(["المفتاح", "القيمة"]);
    for (const [key, value] of Object.entries(backup.data.settings)) settingsSheet.addRow([key, typeof value === "string" ? value : JSON.stringify(value)]);
    settingsSheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${backupFileName()}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) { return apiError(error); }
}
