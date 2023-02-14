import {useS3Upload} from "next-s3-upload";
import cmm from "../js/common";
import useCommon from "./useCommon";

export default function useShopS3Upload() {

    const {uploadToS3} = useS3Upload();

    /**
     * 파일 업로드
     * @param files
     * @param callback
     */
    return (async (files, callback) => {

        cmm.loading(true);
        const uploadList = [];
        const func = async (file) => {

            const upload = await uploadToS3(file);
            const pathIdx = upload.key.match(/\/[0-9]{2}\//).index;

            upload.atchFileActlNm = file.name;
            upload.atchFileSrvrNm = upload.key.substring(pathIdx + 4);
            upload.atchFileSrvrPath = upload.key.substring(0, pathIdx + 3);
            upload.atchFileEts = file.name.substring(file.name.lastIndexOf('.') + 1);
            upload.atchFileSiz = file.size;

            uploadList.push(upload);
        }

        if(Array.isArray(files)) {

            for await (const file of files) {

                await func(file);
            }
        } else {

            await func(files);
        }

        cmm.ajax({
            url: '/api/cmm/upload',
            dataType: 'json',
            data: uploadList,
            success: res => {

                !!callback && callback(res);
            }
        });
    });
}