import { format, parse } from "date-fns";
import { useEffect, useState } from "react";
import { usePapaParse } from "react-papaparse";
import { useNavigate, useParams } from "react-router-dom";
import { useHistoricalFiles } from "../../../state/historicalFiles";
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
import { consolidateData, processData } from "../../../lib/utils";
import { motion } from "framer-motion";
import { useSchedules } from "../../../state/schedules";

const ProcessScheduleModal = () => {
  const navigate = useNavigate();
  const { day } = useParams();

  const { readString } = usePapaParse();

  const addSchedule = useSchedules((state) => state.addSchedule);
  const addLostSchedule = useSchedules((state) => state.addLostSchedule);

  const [dataProcessingBusy, setDataProcessingBusy] = useState(false);
  const [dataProcessingMessage, setDataProcessingMessage] = useState(undefined);
  const [dataProcessingProgress, setDataProcessingProgress] =
    useState(undefined);

  const files = useHistoricalFiles((state) =>
    Object.values(state.files).map((file, index) => {
      return {
        content: file,
        name: Object.keys(state.files)[index],
      };
    })
  );

  useEffect(() => {
    const i = setTimeout(() => {
      setDataProcessingBusy(true);

      const fileDays = files
        .map(({ name }) =>
          format(
            parse(
              name.split("II-")[1].replace(".csv", ""),
              "yyyy-MM-dd-hh-mm-ss",
              Date.now()
            ),
            "d"
          )
        )
        .filter(
          (fileDay) =>
            fileDay === day || parseInt(fileDay) === parseInt(day) - 1
        );

      if (fileDays.length > 1) {
        const appropriateFiles = files.filter(({ name }) =>
          fileDays.includes(
            format(
              parse(
                name.split("II-")[1].replace(".csv", ""),
                "yyyy-MM-dd-hh-mm-ss",
                Date.now()
              ),
              "d"
            )
          )
        );
        const numFiles = appropriateFiles.length;

        setDataProcessingBusy(true);

        setDataProcessingMessage(undefined);
        setTimeout(
          () => setDataProcessingMessage("Processing " + numFiles + " files."),
          100
        );

        let dataset = [];

        for (let fileIndex = 0; fileIndex < numFiles; fileIndex++) {
          setTimeout(() => {
            readString(appropriateFiles[fileIndex]["content"], {
              worker: true,
              header: true,
              skipEmptyLines: true,
              complete: ({ data }) => {
                processData(
                  data,
                  () => {},
                  (data) => {
                    dataset.push(data);

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
                          dataset[0],
                          dataset[1],
                          () => {},
                          () => {},
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
              },
            });
          }, 1000 * fileIndex);
        }
      } else {
        setDataProcessingBusy(false);
        setDataProcessingMessage(
          fileDays.includes(day)
            ? "Please upload data for the previous day."
            : "Please upload data for the current day."
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
            {dataProcessingMessage && (
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
                <Label>{dataProcessingMessage}</Label>
              </motion.div>
            )}
            {dataProcessingProgress && (
              <Progress value={dataProcessingProgress} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProcessScheduleModal;
