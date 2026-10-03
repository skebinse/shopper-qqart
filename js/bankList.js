/**
 * 은행 목록 (계좌 실명확인 은행코드 ↔ 은행명)
 * 화면 선택 목록과 서버 저장 은행명이 같은 기준을 쓰도록 공용으로 사용
 */
export const BANK_LIST = [
    {value: '0002', label: '산업은행'},
    {value: '0003', label: '기업은행'},
    {value: '0004', label: '국민은행'},
    {value: '0007', label: '수협중앙회'},
    {value: '0011', label: '농협은행'},
    {value: '0012', label: '지역농축협'},
    {value: '0020', label: '우리은행'},
    {value: '0023', label: 'SC은행'},
    {value: '0027', label: '씨티은행'},
    {value: '0031', label: '대구은행'},
    {value: '0032', label: '부산은행'},
    {value: '0034', label: '광주은행'},
    {value: '0035', label: '제주은행'},
    {value: '0037', label: '전북은행'},
    {value: '0039', label: '경남은행'},
    {value: '0045', label: '새마을금고'},
    {value: '0048', label: '신협'},
    {value: '0050', label: '저축은행'},
    {value: '0054', label: 'HSBC'},
    {value: '0055', label: '도이치은행'},
    {value: '0057', label: 'JP모간'},
    {value: '0060', label: 'BOA은행'},
    {value: '0061', label: 'BNP 은행'},
    {value: '0062', label: 'ICBC'},
    {value: '0064', label: '산림조합'},
    {value: '0067', label: 'CCB'},
    {value: '0071', label: '우체국'},
    {value: '0081', label: '하나은행'},
    {value: '0088', label: '신한은행'},
    {value: '0089', label: '케이뱅크'},
    {value: '0090', label: '카카오뱅크'},
    {value: '0092', label: '토스뱅크'},
];

/**
 * 은행코드로 은행명 조회
 * @param bankCd
 * @returns {string|null} 목록에 없으면 null
 */
export function getBankNm(bankCd) {

    return BANK_LIST.find(item => item.value === bankCd)?.label ?? null;
}
