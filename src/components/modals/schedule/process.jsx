import { format, parse, subDays } from "date-fns";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { usePapaParse } from "react-papaparse";
import { useNavigate, useParams } from "react-router-dom";
import {
  consolidateData,
  processDialogueData,
  sortByDayNameTime,
} from "../../../lib/utils";
import {
  readFileFromIndexedDB,
  useHistoricalFiles,
} from "../../../state/historicalFiles";
import { useSchedules } from "../../../state/schedules";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Progress } from "../../ui/progress";
import { useToast } from "../../ui/use-toast";

const ProcessScheduleModal = () => {
  const navigate = useNavigate();
  const { day } = useParams();

  const { toast } = useToast();

  const { readString } = usePapaParse();

  const addSchedule = useSchedules((state) => state.addSchedule);
  const addLostSchedule = useSchedules((state) => state.addLostSchedule);

  const [dataProcessingBusy, setDataProcessingBusy] = useState(false);
  const [dataProcessingMessage, setDataProcessingMessage] = useState(undefined);
  const [dataProcessingProgress, setDataProcessingProgress] =
    useState(undefined);

  const files = useHistoricalFiles((state) => state.files);

  useEffect(() => {
    const i = setTimeout(() => {
      setDataProcessingBusy(true);

      const fileDays = files
        .map((name) => [
          format(
            parse(
              name.split("II-")[1].replace(".xlsx", ""),
              "yyyy-MM-dd-hh-mm-ss",
              Date.now()
            ),
            "d"
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
            "d"
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
            "d"
          ) === firstDay ||
          format(
            parse(
              name.split("II-")[1].replace(".xlsx", ""),
              "yyyy-MM-dd-hh-mm-ss",
              Date.now()
            ),
            "d"
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
              setDataProcessingMessage,
              setDataProcessingProgress,
              (data) => {
                dataset.push(sortByDayNameTime(data));

                setDataProcessingMessage(undefined);

                setTimeout(
                  () =>
                    setDataProcessingMessage(
                      "Processed " +
                        (fileIndex + 1) +
                        "/" +
                        numFiles +
                        " files."
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
                          "d"
                        ) === day
                    );

                    dataset[1] = dataset[1].filter(
                      (data) =>
                        parseInt(
                          format(
                            parse(data["Date"], "M/d/yyyy", Date.now()),
                            "d"
                          )
                        ) === parseInt(day)
                    );

                    consolidateData(
                      sortByDayNameTime(dataset[0]),
                      sortByDayNameTime(dataset[1]),
                      setDataProcessingMessage,
                      setDataProcessingProgress,
                      (schedules, lostSchedules) => {
                        schedules.map(addSchedule);
                        lostSchedules.map(addLostSchedule);

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
    });

    return () => {
      clearTimeout(i);
    };
  }, []);

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!dataProcessingBusy) {
          if (!open) navigate("/");
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Day {day}</DialogTitle>
          <DialogDescription>
            Please wait while data is being processed.
          </DialogDescription>
        </DialogHeader>

        {(dataProcessingProgress || dataProcessingMessage) && (
          <div className="flex flex-col space-y-2">
            {dataProcessingMessage !== undefined && (
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
                <Label>{dataProcessingMessage}</Label>
              </motion.div>
            )}
            {dataProcessingProgress !== undefined && (
              <Progress value={dataProcessingProgress} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProcessScheduleModal;
