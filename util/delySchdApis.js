import cmm from "../js/common";
import { format } from 'date-fns';

export function requestCreateSchedule(date, shopIds, timeSlots, onSuccess) {
    cmm.ajax({
        url: '/api/delyschd',
        method: 'POST',
        data: {
            date: format(date, 'yyyy-MM-dd hh:mm:ss'),
            area: shopIds,
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
            area: shopIds,
            schedule: timeSlots.join(','),
        },
        success: onSuccess,
    });
}

export function requestDeleteSchedule(scheduleId, onSuccess) {
    cmm.ajax({
        url: `/api/delyschd/${scheduleId}`,
        method: 'DELETE',
        success: onSuccess,
    });
}

/**
 * 일정 등록 시 선택 가능한 스토어(가맹점) 목록 조회
 */
export function requestGetShops(onSuccess) {
    cmm.ajax({
        url: '/api/cmm/shopList',
        method: 'POST',
        success: onSuccess,
    });
}
