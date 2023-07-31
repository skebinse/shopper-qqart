import cmm from "../../../js/common";
import { format } from 'date-fns';

export function requestCreateSchedule(date, areaId, timeSlots, onSuccess) {
    cmm.ajax({
        url: '/api/delyschd',
        method: 'POST',
        data: {
            date: format(date, 'yyyy-MM-dd hh:mm:ss'),
            area: areaId,
            schedule: timeSlots.join(','),
        },
        success: onSuccess,
    });
}

export function requestGetSchedules(searchDate, onSuccess) {
    cmm.ajax({
        url: `/api/delyschd?startdate=${searchDate?.fromDt}&enddate=${searchDate?.toDt}`,
        method: 'GET',
        success: onSuccess,
    });
}

export function requestGetSchedule(scheduleId, onSuccess) {
    cmm.ajax({
        url: `/api/delyschd/${scheduleId}`,
        method: 'GET',
        success: onSuccess,
    });
}

export function requestUpdateSchedule(scheduleId, areaId, timeSlots, onSuccess) {
    cmm.ajax({
        url: `/api/delyschd/${scheduleId}`,
        method: 'PATCH',
        data: {
            area: areaId,
            schedule: timeSlots.join(','),
        },
        success: onSuccess,
    });
}