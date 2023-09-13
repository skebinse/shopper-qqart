import { addDays, isBefore, isSameDay } from 'date-fns';
import Image from 'next/image';
import styles from "../../../styles/scheduleList.module.css"
import cmm from '../../../js/common';
import { last, padStart, range } from 'lodash';

/**
 * 일정 목록
 */
export default function ScheduleList(props) {
    const { startDate, schedules, holidays, onClickItem, onClickDelete } = props;

    // 오늘 날짜의 0시 0분 0초를 나타내는 Date 객체
    const tomorrow = addDays(new Date(), 1);
    tomorrow.setHours(0, 0, 0, 0);

    /**
     * 삭제 버튼을 누를 때에 z-index 상 아래에 있는 일정 항목으로는 클릭 이벤트를 전파하지 않고 부모 화면에 삭제하려는 일정의 Date와 Schedule 객체 전달
     */
    const _onClickDelete = (event, date, schedule) => {
        event.stopPropagation();
        onClickDelete(date, schedule);
    }

    // 7일 치의 일정 항목 생성
    const items = range(7).map((offset) => {
        // 이 일정의 날짜를 나타내는 Date 객체
        const date = addDays(startDate, offset);

        // 이 일정을 나타내는 Schedule 객체 (저장된 객체 중에 이 일정의 날짜와 같은 객체)
        const schedule = schedules?.find(savedSchedule => isSameDay(new Date(savedSchedule.SHPR_SCHD_YMD), date));
        const isHoliday = holidays?.some(holiday => isSameDay(date, holiday)) || date.getDay() % 6 === 0;
        
        return {
            schedule: schedule,  
            dateString: date.getDate().toString(),
            dayString: cmm.Cont.DAY_OF_WEEK[date.getDay()]?.charAt(0),
            disabled: isBefore(date, tomorrow),
            isHoliday,
            onClickItem: () => onClickItem(date, schedule),
            onClickDelete: (event) => _onClickDelete(event, date, schedule),
        }
    });

    return (
        <div className={styles.scheduleList}>
            <ul>
                {renderList(items)}
            </ul>
        </div>
    )
}

/**
 * 일정 데이터 목록을 받아서 항목의 UI 생성
 */
function renderList(items) {
    return items.map(item => {
        const { schedule, dateString, dayString, disabled, isHoliday, onClickItem, onClickDelete } = item;

        // 일정 항목의 레이블 (등록된 일정이 없으면 '등록 불가' 혹은 '등록하기', 등록된 일정이 있으면 정해진 형식에 맞는 문자열)
        const scheduleString = (() => {
            if (schedule === undefined) {
                return disabled ? '등록 불가' : '등록하기'
            } else {
                return createScheduleLabel(schedule.SHPR_SCHD_HH);
            }
        })();

        // 일정 항목의 날짜와 요일을 나타내는 UI의 스타일 css 값에 붙일 suffix (오늘 날짜 전의 항목이면 'disabled', 휴일이면 'holiday')
        const dateStyleKeySuffix = disabled ? 'disabled' : isHoliday ? 'holiday' : '';

        // 일정 항목의 내용을 나타내는 UI의 스타일 css 값에 붙일 suffix (오늘 날짜 전의 항목이면 'disabled', 등록한 일정이 없으면 'unregistered')
        const scheduleStyleKeySuffix = disabled ? 'disabled' : schedule === undefined ? 'unregistered' : '';

        // 오늘 날짜 이후이고 등록한 일정이 있으면 삭제 버튼 표시
        const isDeleteButtonVisible = !disabled && schedule !== undefined;
 
        return (
            <li key={dateString} onClick={disabled ? undefined : onClickItem}>
                <div className={styles.dayContainer}>
                    <label className={`${styles.dateText} ${styles[dateStyleKeySuffix]}`}>{dateString}</label>
                    <label className={`${styles.dayText} ${styles[dateStyleKeySuffix]}`}>{dayString}</label>
                </div>
                <div className={`${styles.scheduleContainerTail} ${styles[scheduleStyleKeySuffix]}`} />
                <div className={`${styles.scheduleContainer} ${styles[scheduleStyleKeySuffix]}`}>
                    {schedule && !disabled && (
                        <Image alt={'일정'} src={'/assets/images/icon/iconCheck.svg'} width={12} height={12} style={{marginRight: 8}}/>
                    )}
                    <label className={`${styles.scheduleText} ${styles[scheduleStyleKeySuffix]}`}>{scheduleString}</label>
                </div>
                {isDeleteButtonVisible && (
                    <Image
                        className={styles.deleteButton} 
                        src={'/assets/images/btn/btnDel.svg'} 
                        alt={'삭제'} 
                        width={20} 
                        height={20} 
                        onClick={onClickDelete}
                    />
                )}
            </li>
        )
    })
}

/**
 * 일정 내용을 나타내는 레이블 생성
 */
function createScheduleLabel(scheduleString) {
    // Schedule 객체에 저장되어 있는 시간 문자열을 배열로 만들고 시간 순으로 정렬
    const startTimeList = scheduleString.split(',').map(Number).sort((a, b) => a - b);

    // 연속되어 있는 일정 시간을 묶은 덩어리들의 배열
    const chunks = [];
    
    // 일정 시간 덩어리의 시작 시각
    let chunkStart = startTimeList[0];
    for (let i = 0; i < startTimeList.length - 1; i++) {
        const current = startTimeList[i];
        const next = startTimeList[i + 1];
        
        // 이 시각이 다음 시각과 연속되어 있지 않으면, 일정 시간 덩어리의 시작 시각과 합쳐서 한 덩어리로 만들어 배열에 삽입하고, 다음 시각을 새로운 덩어리의 시작 시각으로 설정
        if (current < next - 1) {
            chunks.push(`${chunkStart}시~${current + 1}시`);
            chunkStart = next;
        }
    }
    // Iteration이 끝난 뒤에 마지막 시각을 시작 시각과 합쳐서 한 덩어리로 만들어 배열에 삽입
    chunks.push(`${pad(chunkStart)}시~${pad(last(startTimeList) + 1)}시`);
    
    return chunks.join(', ');
}

/**
 * 시각을 나타내는 Number를 두 자리의 문자열로 반환
 */
function pad(num) {
    return padStart(`${num}`, 2, '0');
}