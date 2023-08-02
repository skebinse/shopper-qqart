import React, {useEffect, useState} from 'react';
import BottomMenu from "../../../components/bottomMenu";
import WeekDate from "../../../components/date/WeekDate";
import HeadTitle from '../../../components/headTitle';
import { createLocalDate } from '../../../util/dateUtil';
import ScheduleList from './scheduleList';
import ScheduleEditor from './scheduleEditor';
import { requestGetSchedule, requestGetSchedules, requestCreateSchedule, requestUpdateSchedule, requestDeleteSchedule } from './ajaxCall';
import cmm from '../../../js/common';
import { remove } from 'lodash';

export default function DelySchd() {
    
    const [schedules, setSchedules] = useState([]);
    const [searchDate, setSearchDate] = useState(undefined);
    const [holidays, setHolidays] = useState([]);
    const [editingDate, setEditingDate] = useState();
    const [editingSchedule, setEditingSchedule] = useState();
    const [isEditorVisible, setEditorVisible] = useState();

    useEffect(() => {
        if (searchDate === undefined) {
            return;
        }
        
        requestGetSchedules(searchDate, setSchedules);
        
        // TODO: 서버에서 휴일 받아 오기
        setHolidays([new Date('2023-07-24T00:00:00-04:00'), new Date('2023-07-30T00:00:00-04:00')])
    }, [searchDate]);

    const onClickSchedule = (date, schedule) => {
        setEditingDate(date);
        setEditingSchedule(schedule);
        setEditorVisible(true);
    }

    const removeSchedule = (schedule) => {
        requestDeleteSchedule(schedule.SHPR_SCHD_ID, () => {
            setSchedules(prev => {
                const newSchedules = [...prev];
                remove(newSchedules, storedSchedule => storedSchedule.SHPR_SCHD_ID === schedule.SHPR_SCHD_ID);
                return newSchedules;
            });
        })
    }

    const onClickDelete = (date, schedule) => {
        cmm.confirm(`${date.getDate()}일 일정을 삭제하시겠습니까?`, () => removeSchedule(schedule));
    }

    const closeScheduleEditor = () => {
        setEditingDate(undefined);
        setEditingSchedule(undefined);
        setEditorVisible(false);
    }

    const replaceSchedule = (updatedSchedule) => {
        setSchedules(prev => {
            const updatedSchedules = [...prev];
            let isFound = false;

            for (let i = 0; i < prev.length; i++) {
                if (updatedSchedules[i]?.SHPR_SCHD_ID === updatedSchedule.SHPR_SCHD_ID) {
                    updatedSchedules[i] = updatedSchedule;
                    isFound = true;
                    break;
                }
            }
            if (!isFound) {
                updatedSchedules.push(updatedSchedule);
            }
            
            return updatedSchedules;
        })
    }

    const refreshSchedule = (scheduleId) => requestGetSchedule(scheduleId, replaceSchedule);

    const createSchedule = (date, areaId, timeSlots) => requestCreateSchedule(date, areaId, timeSlots, refreshSchedule);

    const updateSchedule = (scheduleId, areaId, timeSlots) => 
        requestUpdateSchedule(scheduleId, areaId, timeSlots, refreshSchedule);

    const onSubmitSchedule = (areaId, timeSlots) => {
        if (editingSchedule === undefined) {
            createSchedule(editingDate, areaId, timeSlots);
        } else {
            updateSchedule(editingSchedule.SHPR_SCHD_ID, areaId, timeSlots);
        }

        closeScheduleEditor();
    }

    const startDate = createLocalDate(searchDate?.fromDt);

    return (
        <div>
            <HeadTitle title='일정 관리'/>
            <WeekDate onSelectDate={date => setSearchDate(date)} />
            {startDate && (
                <ScheduleList
                    startDate={startDate}
                    schedules={schedules}
                    holidays={holidays}
                    onClickItem={onClickSchedule}
                    onClickDelete={onClickDelete}
                />
            )}
            <ScheduleEditor
                schedule={editingSchedule}
                isVisible={isEditorVisible}
                onSubmit={onSubmitSchedule}
                onClose={closeScheduleEditor}
            />
        </div>
    );
}