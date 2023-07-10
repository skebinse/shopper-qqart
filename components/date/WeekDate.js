import React, {useCallback, useEffect, useState} from 'react';
import Image from "next/image";
import cmm from "../../js/common";

export default function WeekDate({onSelectDate}) {

    const [searchDate, setSearchDate] = useState(null);
    const [isLastDate, setIsLastDate] = useState(true);

    useEffect(() => {

        // 조회 일자 변경
        searchDateChange();
    }, []);

    /**
     * 조회 일자 변경
     * @param kd
     */
    const searchDateChange = useCallback( kd => {

        // 오늘일자 보다 큰 경우 return
        if(kd === 'next' && searchDate.toDt >= cmm.date.getToday('-')) return;

        const stdDate = !!kd ? cmm.date.calDateReturnDt(searchDate.formDt, 'D', (kd === 'prev' ? -7 : 7)) : new Date();
        const weekIdx = stdDate.getDay();
        const formDt = cmm.date.calDate(stdDate, 'D', -(weekIdx > 0 ? weekIdx - 1 : 6), '-');
        const toDt = cmm.date.calDate(stdDate, 'D', 7 - (weekIdx > 0 ? weekIdx : 7), '-');

        const selectDate = {
            formDt,
            toDt,
            text: `${formDt.substring(5).replace('-', '월')}일 ~ ${toDt.substring(5).replace('-', '월')}일`
        };
        setSearchDate(selectDate);

        // 오늘보다 큰 날일 경우
        setIsLastDate(toDt >= cmm.date.getToday('-'));

        // calblack
        !!onSelectDate && onSelectDate(selectDate);
    }, [searchDate]);

    return (
        <div className={'weekDateDiv'}>
            <Image src={'/assets/images/icon/iconArrowL.svg'} alt={'이전일자'} width={24} height={24} onClick={() => searchDateChange('prev')} />
            <span>{searchDate?.text}</span>
            <Image className={isLastDate ? 'noVtlz' : ''} src={'/assets/images/icon/iconArrowL.svg'} alt={'다음일자'} width={24} height={24} onClick={() => searchDateChange('next')} />
        </div>
    );
}