import React, {useEffect, useState} from 'react';
import BottomMenu from "../../../components/bottomMenu";
import WeekDate from "../../../components/date/WeekDate";
import HeadTitle from '../../../components/headTitle';
import { createLocalDate } from '../../../util/dateUtil';
import ScheduleList from './scheduleList';
import ScheduleEditor from './scheduleEditor';

const TODAY = new Date();
const DUMMY_SCHEDULES = [0, 1, 2, 3, 4].map(
    (offset) => {
        const date = new Date();
        return {
            SHPR_SCHD_ID: offset,
            SHPR_ID: offset,
            SHPR_SCHD_YMD: date.toISOString(),
            SHPR_SCHD_AREA: '001',
            SHPR_SCHD_HH: offset % 2 === 0 ? '08,09,11,13,14,15,19,20,21,22' : '07,09,14,15,16,17,19,21',
            RGI_DT: TODAY.toISOString(),
            RGI_ID: offset,
            MDFC_DT: TODAY.toISOString(),
            MDFC_ID: offset,
        }
    }
);

export default function DelySchd() {
    
    const [schedules, setSchedules] = useState([]);
    const [searchDate, setSearchDate] = useState(undefined);
    const [holidays, setHolidays] = useState([]);
    const [editingSchedule, setEditingSchedule] = useState();
    const [isEditorVisible, setEditorVisible] = useState();

    useEffect(() => {
        if (searchDate === undefined) {
            return;
        }
        
        // TODO: 서버에 저장된 일정 받아 오기
        setSchedules(DUMMY_SCHEDULES);
        
        // TODO: 서버에서 휴일 받아 오기
        setHolidays([new Date('2023-07-24T00:00:00-04:00'), new Date('2023-07-30T00:00:00-04:00')])
    }, [searchDate]);

    const onClickSchedule = (schedule) => {
        setEditingSchedule(schedule);
        setEditorVisible(true);
    }

    const closeScheduleEditor = () => setEditorVisible(false);

    const onSubmitSchedule = (areaId, timeSlots) => {
        closeScheduleEditor();
        // TODO: 서버에 선택 사항 전송
    }
        
    const startDate = createLocalDate(searchDate?.fromDt);

    return (
        <div>
            <HeadTitle />
            <WeekDate onSelectDate={date => setSearchDate(date)} />
            {startDate && (
                <ScheduleList
                    startDate={startDate}
                    schedules={schedules}
                    holidays={holidays}
                    onClickItem={onClickSchedule}
                />
            )}
            <BottomMenu idx={1} />
            <ScheduleEditor
                schedule={editingSchedule}
                isVisible={isEditorVisible}
                onSubmit={onSubmitSchedule}
                onClose={closeScheduleEditor}
            />
        </div>
    );
}