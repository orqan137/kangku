import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'kangku',
  plugins: [
    appsInToss({
      brand: {
        displayName: '강꾸', // 앱인토스 콘솔의 표시 이름과 일치시켜야 합니다.
        primaryColor: '#FF5C7A',
        icon: '', // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
      },
      permissions: [],
    }),
  ],
});
