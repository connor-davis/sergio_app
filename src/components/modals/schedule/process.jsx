import { format, parse, subDays } from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";
import { usePapaParse } from "react-papaparse";
import { useNavigate, useParams } from "react-router-dom";
import {
  consolidateData,
  processDialogueData,
  processInvoicingReportData,
  sortBy,
  sortByDayNameTime,
} from "../../../lib/utils";
import {
  readFileFromIndexedDB,
  useHistoricalFiles,
} from "../../../state/historicalFiles";
import { useSchedules } from "../../../state/schedules";
import { useTeachers } from "../../../state/teachers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Progress } from "../../ui/progress";
import { useToast } from "../../ui/use-toast";
import { Button } from "../../ui/button";

const ProcessScheduleModal = () => {
  const navigate = useNavigate();
  const { day } = useParams();

  const { toast } = useToast();

  const { readString } = usePapaParse();

  const schedulesList = useSchedules((state) => state.schedules);
  const addSchedules = useSchedules((state) => state.addSchedules);

  const lostSchedulesList = useSchedules((state) => state.lostSchedules);
  const addLostSchedules = useSchedules((state) => state.addLostSchedules);

  const teachersList = useTeachers((state) => state.teachers);
  const setTeachers = useTeachers((state) => state.setTeachers);

  const [invoicingReportData, setInvoicingReportData] = useState(false);

  const [dataProcessingBusy, setDataProcessingBusy] = useState(false);
  const [dataProcessingMessage, setDataProcessingMessage] = useState(undefined);
  const [dataProcessingProgress, setDataProcessingProgress] =
    useState(undefined);

  const files = useHistoricalFiles((state) => state.files);

  const handleUpload = (event) => {
    setDataProcessingBusy(true);
    setDataProcessingMessage("Reading invoicing report");
    setDataProcessingProgress(undefined);

    const file = event.target.files[0];

    const reader = new FileReader();

    reader.onload = (event) => {
      const fileString = event.target.result;

      readString(fileString, {
        worker: true,
        header: true,
        complete: (result) => {
          processInvoicingReportData(
            result,
            day,
            setDataProcessingMessage,
            setDataProcessingProgress,
            (data) => {
              setDataProcessingBusy(false);
              setDataProcessingMessage(undefined);
              setDataProcessingProgress(undefined);

              setTeachers(sortBy(data, ["teacherName"]));

              setInvoicingReportData(true);
            }
          );
        },
      });
    };

    reader.readAsText(file);
  };

  const beginDataProcessing = () => {
    setDataProcessingBusy(true);

    const fileDays = files
      .map((name) => [
        format(
          parse(
            name.split("II-")[1].replace(".xlsx", ""),
            "yyyy-MM-dd-hh-mm-ss",
            Date.now()
          ),
          "M-d-yyyy"
        ),
        format(
          subDays(
            parse(
              name.split("II-")[1].replace(".xlsx", ""),
              "yyyy-MM-dd-hh-mm-ss",
              Date.now()
            ),
            6
          ),
          "M-d-yyyy"
        ),
      ])
      .filter(
        (fileDay) => fileDay[0] === day // This ensures that we are working with the selected days shifts and the original shifts for the selected day.
      )[0];

    const firstDay = fileDays[1];
    const secondDay = fileDays[0];

    const appropriateFiles = files.filter(
      (name) =>
        format(
          parse(
            name.split("II-")[1].replace(".xlsx", ""),
            "yyyy-MM-dd-hh-mm-ss",
            Date.now()
          ),
          "M-d-yyyy"
        ) === firstDay ||
        format(
          parse(
            name.split("II-")[1].replace(".xlsx", ""),
            "yyyy-MM-dd-hh-mm-ss",
            Date.now()
          ),
          "M-d-yyyy"
        ) === secondDay
    );
    const numFiles = appropriateFiles.length;

    if (numFiles > 1) {
      setDataProcessingBusy(true);

      setDataProcessingMessage(undefined);
      setTimeout(
        () => setDataProcessingMessage("Processing " + numFiles + " files."),
        100
      );
      setDataProcessingProgress(0);

      let dataset = [];

      for (let fileIndex = 0; fileIndex < numFiles; fileIndex++) {
        setTimeout(async () => {
          processDialogueData(
            await readFileFromIndexedDB(appropriateFiles[fileIndex]),
            day,
            setDataProcessingMessage,
            setDataProcessingProgress,
            (data) => {
              dataset.push(data);

              setDataProcessingMessage(undefined);

              setTimeout(
                () =>
                  setDataProcessingMessage(
                    "Processed " + (fileIndex + 1) + "/" + numFiles + " files."
                  ),
                100
              );
              setDataProcessingProgress(
                Math.ceil(((fileIndex + 1) / numFiles) * 100)
              );

              setTimeout(() => {
                if (fileIndex + 1 === numFiles) {
                  setDataProcessingProgress(undefined);

                  setDataProcessingMessage(undefined);
                  setTimeout(
                    () =>
                      setDataProcessingMessage(
                        "Consolidating data between days."
                      ),
                    100
                  );

                  dataset[0] = dataset[0].filter(
                    (data) =>
                      format(
                        parse(data["Date"], "M/d/yyyy", Date.now()),
                        "M-d-yyyy"
                      ) === day
                  );

                  dataset[1] = dataset[1].filter(
                    (data) =>
                      format(
                        parse(data["Date"], "M/d/yyyy", Date.now()),
                        "M-d-yyyy"
                      ) === day
                  );

                  consolidateData(
                    sortByDayNameTime(dataset[0]),
                    sortByDayNameTime(dataset[1]),
                    setDataProcessingMessage,
                    setDataProcessingProgress,
                    (schedules, lostSchedules) => {
                      addSchedules(day, schedules);
                      addLostSchedules(day, lostSchedules);

                      setDataProcessingBusy(false);
                      setDataProcessingMessage(undefined);
                      setDataProcessingProgress(undefined);

                      navigate("/");
                    }
                  );
                }
              });
            }
          );
        }, 1000 * fileIndex);
      }
    } else {
      setDataProcessingBusy(false);
      setDataProcessingMessage(
        "Please ensure that you have the selected days dialogue data uploaded and the dialogue data from 6 days before the selected day uploaded."
      );
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!dataProcessingBusy) {
          if (!open) navigate("/");
        }
      }}
    >
      {!invoicingReportData && (
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invoicing Report</DialogTitle>
              <DialogDescription>
                Please provide the latest invoicing report.
              </DialogDescription>
            </DialogHeader>

            {!dataProcessingBusy && (
              <Input
                id="csv"
                type="file"
                accept=".csv"
                onChange={handleUpload}
              />
            )}

            {dataProcessingBusy && (
              <div className="flex flex-col space-y-2">
                <Label>{dataProcessingMessage}</Label>
                <Progress value={dataProcessingProgress} />
              </div>
            )}
          </DialogContent>
        </motion.div>
      )}

      {invoicingReportData && (
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Day {day}</DialogTitle>
              <DialogDescription>
                Please wait while data is being processed.
              </DialogDescription>
            </DialogHeader>

            {dataProcessingBusy && (
              <div className="flex flex-col space-y-2">
                {dataProcessingMessage !== undefined && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                  >
                    <Label>{dataProcessingMessage}</Label>
                  </motion.div>
                )}
                {dataProcessingProgress !== undefined && (
                  <Progress value={dataProcessingProgress} />
                )}
              </div>
            )}

            <Button
              disabled={dataProcessingBusy}
              onClick={() => beginDataProcessing()}
            >
              Process Data
            </Button>
          </DialogContent>
        </motion.div>
      )}
    </Dialog>
  );
};

export default ProcessScheduleModal;
