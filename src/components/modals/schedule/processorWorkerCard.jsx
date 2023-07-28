import React, { useEffect, useState } from "react";
import { useReactiveWorker } from "../../../hooks/useReactiveWorker";
import { Card } from "../../ui/card";
import { Label } from "../../ui/label";
import { Progress } from "../../ui/progress";
import { Button } from "../../ui/button";
import { motion } from "framer-motion";
import { useSchedules } from "../../../state/schedules";
import { useTeachers } from "../../../state/teachers";

const ProcessorWorkerCard = ({ data = [], onComplete = () => {} }) => {
  const [response, message, progress, error] = useReactiveWorker(
    "dialogInvoicingProcessorWorker",
    data
  );
  const [
    mutateSchedulesResponse,
    mutateSchedulesMessage,
    mutateSchedulesProgress,
    mutateSchedulesError,
    setMutateSchedulesWorkerData,
  ] = useReactiveWorker("mutateSchedulesWorker", undefined);
  const [
    mutateTeachersResponse,
    mutateTeachersMessage,
    mutateTeachersProgress,
    mutateTeachersError,
    setMutateTeachersWorkerData,
  ] = useReactiveWorker("mutateTeachersWorker", undefined);

  const [summary, setSummary] = useState({});

  const schedules = useSchedules((state) => state.schedules);
  const setSchedules = useSchedules((state) => state.setSchedules);

  const teachers = useTeachers((state) => state.teachers);
  const setTeachers = useTeachers((state) => state.setTeachers);

  useEffect(() => {
    if (response) {
      const [
        processedTeachers,
        processedGroups,
        processedSchedules,
        processedInvoices,
        processedSummary,
      ] = response;

      setSummary(processedSummary);

      setMutateSchedulesWorkerData([schedules, processedSchedules]);
      setMutateTeachersWorkerData([teachers, processedTeachers]);
    }
  }, [response]);

  useEffect(() => {
    if (mutateSchedulesResponse) {
      console.log(mutateSchedulesResponse);
    }
  }, [mutateSchedulesResponse]);

  useEffect(() => {
    if (mutateTeachersResponse) {
      console.log(mutateTeachersResponse);
    }
  }, [mutateTeachersResponse]);

  return (
    <Card className="border-none shadow-none">
      {error && (
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <Label className="text-red-500">{error}</Label>
        </motion.div>
      )}

      {!response && !error && (
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <div className="flex flex-col space-y-2">
            {message && <Label>{message}</Label>}
            {progress && <Progress value={progress} />}
          </div>
        </motion.div>
      )}

      {response && (
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <div className="flex flex-col space-y-2">
            <Card className="flex flex-col p-0 space-y-3 border-none shadow-none">
              <Label className="text-xl font-bold">Summary</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="">Teachers</Label>
                  <Label className="font-bold">{summary.Teachers || 0}</Label>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="">Groups</Label>
                  <Label className="font-bold">{summary.Groups || 0}</Label>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="">Shifts</Label>
                  <Label className="font-bold">{summary.Schedules || 0}</Label>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="">Invoices</Label>
                  <Label className="font-bold">{summary.Invoices || 0}</Label>
                </div>
              </div>
            </Card>

            <Button
              className="w-full"
              onClick={() => {
                setSchedules(mutateSchedulesResponse || []);
                setTeachers(mutateTeachersResponse || []);

                onComplete();
              }}
            >
              Save Data
            </Button>
          </div>
        </motion.div>
      )}
    </Card>
  );
};

export default ProcessorWorkerCard;
