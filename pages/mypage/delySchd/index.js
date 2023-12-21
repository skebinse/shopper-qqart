import React, {useEffect, useState} from 'react';
import BottomMenu from "../../../components/bottomMenu";
import WeekDate from "../../../components/date/WeekDate";
import HeadTitle from '../../../components/headTitle';
import { createLocalDate } from '../../../util/dateUtil';
import ScheduleList from './scheduleList';
import ScheduleEditor from './scheduleEditor';
import { requestGetSchedule, requestGetSchedules, requestCreateSchedule, requestUpdateSchedule, requestDeleteSchedule } from '../../../util/delySchdApis';
import cmm from '../../../js/common';
import { remove } from 'lodash';

export default function DelySchd() {
    // Schedule 
    // SHPR_SCHD_ID:	INT             쇼퍼 일정 관리 ID	AUTO_INCREMENT
    // SHPR_ID:         INT             쇼퍼 ID	
    // SHPR_SCHD_YMD:	DATE	        쇼퍼 일정 일자	
    // SHPR_SCHD_AREA:	VARCHAR(100)	쇼퍼 일정 지역	
    // SHPR_SCHD_HH:	VARCHAR(100)	쇼퍼 일정 시간	    예) 08,09,13,16
    // RGI_DT:	        DATETIME	    등록 일시	
    // RGI_ID:	        INT	            등록 ID	
    // MDFC_DT:	        DATETIME	    수정 일시	
    // MDFC_ID:	        INT	            수정 ID	
    const [schedules, setSchedules] = useState([]);

    // SearchDate
    // fromDt: 검색 시작 날짜를 나타내는 문자열
    // toDt: 검색 종료 날짜를 나타내는 문자열
    const [searchDate, setSearchDate] = useState(undefined);
    const [holidays, setHolidays] = useState([]);
    
    // 생성이나 수정 중인 일정의 날짜 Date 객체
    const [editingDate, setEditingDate] = useState();

    // 생성이나 수정 중인 Schedule 객체
    const [editingSchedule, setEditingSchedule] = useState();

    // 일정 생성 및 수정 화면 표시 여부
    const [isEditorVisible, setEditorVisible] = useState();

    useEffect(() => {
        if (searchDate === undefined) {
            return;
        }
        
        // 화면에 표시하려는 일정의 첫 날짜가 유효한 값이면, 서버에 저장된 일정 요청
        requestGetSchedules(searchDate, setSchedules);
        
        // TODO: 서버에서 휴일 받아 오기
        setHolidays([]);
    }, [searchDate]);

    /**
     * 클릭한 일정의 Date 객체와 Schedule 객체 저장
     */
    const onClickSchedule = (date, schedule) => {
        setEditingDate(date);
        setEditingSchedule(schedule);
        setEditorVisible(true);
    }

    /**
     * Schedule 객체의 ID로 서버에 요청
     */
    const removeSchedule = (schedule) => {
        requestDeleteSchedule(schedule.SHPR_SCHD_ID, () => {
            setSchedules(prev => {
                const newSchedules = [...prev];
                remove(newSchedules, storedSchedule => storedSchedule.SHPR_SCHD_ID === schedule.SHPR_SCHD_ID);
                return newSchedules;
            });
        })
    }

    /**
     * 일정 삭제 버튼을 클릭 하면 확인 팝업 표시
     */
    const onClickDelete = (date, schedule) => {
        cmm.confirm(`${date.getDate()}일 일정을 삭제하시겠습니까?`, () => removeSchedule(schedule));
    }

    /**
     * 일정 생성 및 수정 화면을 닫을 때에 수정 중인 Date 및 Schedule 객체를 비움
     */
    const closeScheduleEditor = () => {
        setEditingDate(undefined);
        setEditingSchedule(undefined);
        setEditorVisible(false);
    }
 
    /**
     * 전달 받은 Schedule 객체의 ID와 같은 객체를, 저장된 Schedule 배열에서 찾아서 교체
     */
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

    /**
     * 전달 받은 Schedule 객체의 ID를 서버에 요청해서 최신 Schedule 객체를 받아 온 뒤에 저장되어 있는 값 교체
     */
    const refreshSchedule = (scheduleId) => requestGetSchedule(scheduleId, replaceSchedule);

    /**
     * Date 객체와 지역 이름 문자열과 시간으로 서버에 일정 생성 요청
     */
    const createSchedule = (date, area, timeSlots) => requestCreateSchedule(date, area, timeSlots, refreshSchedule);

    /**
     * Schedule 객체의 ID와 지역 이름 문자열과 시간으로 서버에 일정 수정 요청
     */
    const updateSchedule = (scheduleId, area, timeSlots) => 
        requestUpdateSchedule(scheduleId, area, timeSlots, refreshSchedule);

    /**
     * 일정 생성 및 수정 화면에서 확인 버튼을 눌렀을 때에 저장되어 있는 Schedule 객체가 없으면 생성 요청, 있으면 수정 요청
     */
    const onSubmitSchedule = (area, timeSlots) => {
        if (editingSchedule === undefined) {
            createSchedule(editingDate, area, timeSlots);
        } else {
            updateSchedule(editingSchedule.SHPR_SCHD_ID, area, timeSlots);
        }

        closeScheduleEditor();
    }

    // 표시하려는 일정 목록의 시작 날짜에 시간대 suffix를 붙인 값
    const startDate = createLocalDate(searchDate?.fromDt);

    return (
        <div>
            <HeadTitle title='일정 관리'/>
            <WeekDate onSelectDate={date => setSearchDate(date)} isNextWeek={true} />
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
                date={editingDate}
                schedule={editingSchedule}
                isVisible={isEditorVisible}
                onSubmit={onSubmitSchedule}
                onClose={closeScheduleEditor}
            />
        </div>
    );
}