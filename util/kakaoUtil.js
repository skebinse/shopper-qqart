/**
 * 카카오 액세스 토큰으로 회원번호 조회 (서버 전용)
 * 클라이언트가 보낸 회원번호(userCrctno)를 신뢰하지 않고, 카카오에서 직접 확인한 값만 사용한다.
 * @param accessToken
 * @returns {Promise<string|null>} 카카오 회원번호, 토큰이 유효하지 않으면 null
 */
export async function getKakaoUserId(accessToken) {

    if(!accessToken || typeof accessToken !== 'string') {

        return null;
    }

    try {

        const res = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: 'Bearer ' + accessToken,
            },
        });

        if(!res.ok) {

            return null;
        }

        const profile = await res.json();

        return !!profile?.id ? String(profile.id) : null;
    } catch (e) {

        console.log(new Intl.DateTimeFormat( 'ko', { dateStyle: 'medium', timeStyle: 'medium'  } ).format(new Date()));
        console.log(e);

        return null;
    }
}
