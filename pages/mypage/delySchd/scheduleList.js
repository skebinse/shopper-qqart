import { addDays, isBefore, isSameDay } from 'date-fns';
import Image from 'next/image';
import styles from "../../../styles/scheduleList.module.css"
import cmm from '../../../js/common';
import { last, padStart, range } from 'lodash';

export default function ScheduleList(props) {
    const { startDate, schedules, holidays, onClickItem, onClickDelete } = props;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const _onClickDelete = (event, date, schedule) => {
        event.stopPropagation();
        onClickDelete(date, schedule);
    }

    const items = range(7).map((offset) => {
        const date = addDays(startDate, offset);
        const schedule = schedules.find(savedSchedule => isSameDay(new Date(savedSchedule.SHPR_SCHD_YMD), date));
        const isHoliday = holidays.some(holiday => isSameDay(date, holiday)) || date.getDay() % 6 === 0;
        
        return {
            schedule: schedule,  
            dateString: date.getDate().toString(),
            dayString: cmm.Cont.DAY_OF_WEEK[date.getDay()].charAt(0),
            disabled: isBefore(date, today),
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

function renderList(items) {
    return items.map(item => {
        const { schedule, dateString, dayString, disabled, isHoliday, onClickItem, onClickDelete } = item;

        const scheduleString = (() => {
            if (schedule === undefined) {
                return disabled ? '등록 불가' : '등록하기'
            } else {
                return createScheduleLabel(schedule.SHPR_SCHD_HH);
            }
        })();

        const dateStyleKeySuffix = disabled ? 'disabled' : isHoliday ? 'holiday' : '';
        const scheduleStyleKeySuffix = disabled ? 'disabled' : schedule === undefined ? 'unregistered' : '';

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

function createScheduleLabel(scheduleString) {
    const startTimeList = scheduleString.split(',').map(Number).sort((a, b) => a - b);

    const chunks = [];
    let chunkStart = startTimeList[0];
    for (let i = 0; i < startTimeList.length - 1; i++) {
        const current = startTimeList[i];
        const next = startTimeList[i + 1];
        if (current < next - 1) {
            chunks.push(`${chunkStart}시~${current + 1}시`);
            chunkStart = next;
        }
    }
    chunks.push(`${pad(chunkStart)}시~${pad(last(startTimeList) + 1)}시`);
    
    return chunks.join(', ');
}

function pad(num) {
    return padStart(`${num}`, 2, '0');
}