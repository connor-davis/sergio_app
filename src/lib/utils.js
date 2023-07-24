import { clsx } from "clsx";
import { compareAsc, format, parse } from "date-fns";
import ExcelJS from "exceljs";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const processDialogueData = async (
  buffer,
  onEvent = (message) => {},
  onProgress = (progress) => {},
  onComplete = (data) => {}
) => {
  const steps = 3;

  const Workbook = new ExcelJS.Workbook();

  onEvent("Loading excel file.");

  await Workbook.xlsx.load(buffer);

  const DialogueSheet = Workbook.getWorksheet("Dialogue Scheduled Shifts - II");

  DialogueSheet.unprotect();
  DialogueSheet.unMergeCells();

  let autoFoundRow = 0;

  onProgress(Math.ceil((1 / 3) * 100));
  onEvent("Looking for Auto Assignment data.");

  DialogueSheet.eachRow(function (row, rowNumber) {
    if (row.getCell("B").value === "Auto Assignment DL") {
      autoFoundRow = rowNumber;
    }
  });

  let backIndex = 0;

  onProgress(Math.ceil((2 / 3) * 100));
  onEvent("Processing rows.");

  const data = DialogueSheet.getRows(
    autoFoundRow,
    DialogueSheet.actualRowCount - 4
  )
    .filter((row, index) => {
      onProgress(Math.ceil((index / (DialogueSheet.actualRowCount - 4)) * 100));

      return row.getCell("H").value !== (undefined || null);
    })
    .map((row, index) => {
      const RowIndex = row.number;
      const ShiftDate = row.getCell("F").value;
      const Shift = row.getCell("H").value;

      if (!row.getCell("C").value) backIndex -= 1;
      else backIndex = 0;

      onProgress(
        Math.ceil(
          (index / (DialogueSheet.actualRowCount - 4 - autoFoundRow)) * 100
        )
      );

      return {
        Name: DialogueSheet.getRow(RowIndex + backIndex).getCell("C").value,
        Date: format(
          parse(ShiftDate, "M/d/yyyy h:mm a", Date.now()),
          "M/d/yyyy"
        ),
        Time: format(parse(ShiftDate, "M/d/yyyy h:mm a", Date.now()), "h:mm a"),
        Shift,
        Day: format(parse(ShiftDate, "M/d/yyyy h:mm a", Date.now()), "d"),
      };
    });

  onProgress(Math.ceil((3 / steps) * 100));

  onComplete(data);
};

export const sortByDayNameTime = (rows) => {
  return rows.sort((a, b) => {
    if (
      compareAsc(
        parse(a["Date"], "M/d/yyyy", Date.now()),
        parse(b["Date"], "M/d/yyyy", Date.now())
      ) +
        a["Name"] +
        compareAsc(
          parse(a["Time"], "h:mm a", Date.now()),
          parse(b["Time"], "h:mm a", Date.now())
        ) >
      compareAsc(
        parse(b["Date"], "M/d/yyyy", Date.now()),
        parse(a["Date"], "M/d/yyyy", Date.now())
      ) +
        b["Name"] +
        compareAsc(
          parse(b["Time"], "h:mm a", Date.now()),
          parse(a["Time"], "h:mm a", Date.now())
        )
    )
      return 1;
    if (
      compareAsc(
        parse(a["Date"], "M/d/yyyy", Date.now()),
        parse(b["Date"], "M/d/yyyy", Date.now())
      ) +
        a["Name"] +
        compareAsc(
          parse(a["Time"], "h:mm a", Date.now()),
          parse(b["Time"], "h:mm a", Date.now())
        ) <
      compareAsc(
        parse(b["Date"], "M/d/yyyy", Date.now()),
        parse(a["Date"], "M/d/yyyy", Date.now())
      ) +
        b["Name"] +
        compareAsc(
          parse(b["Time"], "h:mm a", Date.now()),
          parse(a["Time"], "h:mm a", Date.now())
        )
    )
      return -1;
    return 0;
  });
};

export const consolidateData = (
  previousDataset,
  currentDataset,
  onEvent = (message) => {},
  onProgress = (progress) => {},
  onComplete = (data) => {}
) => {
  const steps = 2;

  onEvent("Processing shift numbers.");

  const previousShiftNumbers = previousDataset.map((data) => data["Shift"]);
  const currentShiftNumbers = currentDataset.map((data) => data["Shift"]);
  const lostShifts = previousShiftNumbers.filter(
    (shiftNumber) => !currentShiftNumbers.includes(shiftNumber)
  );
  const newShifts = currentShiftNumbers.filter(
    (shiftNumber) => !previousShiftNumbers.includes(shiftNumber)
  );

  const previousShiftTeachers = Object.fromEntries(
    previousDataset.map((data) => [data["Shift"], data["Name"]])
  );

  onProgress(Math.ceil((1 / 2) * 100));
  onEvent("Processing picked up and lost shifts.");

  const pickedUpShifts = currentDataset
    .filter((data) => previousShiftTeachers[data["Shift"]] !== data["Name"])
    .map((data) => data["Shift"]);

  const lostButPickedUp = previousDataset
    .map((data) => data["Shift"])
    .filter((shiftNumber) => pickedUpShifts.includes(shiftNumber));

  onProgress(Math.ceil((2 / 2) * 100));

  onComplete(
    sortByDayNameTime([
      ...currentDataset.map((data) => {
        let ShiftType = "-";

        if (newShifts.includes(data["Shift"])) {
          ShiftType = "Pickup";

          return {
            ...data,
            ShiftType,
          };
        }

        if (pickedUpShifts.includes(data["Shift"])) {
          ShiftType = "Internal Pickup";

          return {
            ...data,
            ShiftType,
          };
        }

        return {
          ...data,
          ShiftType,
        };
      }),
      ...previousDataset
        .filter((data) => lostButPickedUp.includes(data["Shift"]))
        .map((data) => {
          return { ...data, ShiftType: "Dropped & Picked Up" };
        }),
    ]),
    sortByDayNameTime(
      previousDataset.filter((data) => lostShifts.includes(data["Shift"]))
    )
  );
};

export const pivotBuilder = () => {};

export const exportSchedules = async (schedules) => {
  const worksheet = XLSX.utils.json_to_sheet(sortByDayNameTime(schedules));
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Shift Data");

  XLSX.writeFile(
    workbook,
    "AutomaticReport-" + format(Date.now(), "yyyy-MM-dd-hh-mm-ss") + ".xlsx",
    { cellStyles: true, bookType: "xlsx" }
  );
};
