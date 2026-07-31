import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
const features = ['자료 낙서', '수업 채팅', '공부 공유', '교수님께 한마디'];

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f0e7' }}>
        <View style={{ padding: 24, gap: 18 }}>
          <Text style={{ fontSize: 34, fontWeight: '900', color: '#2b241e' }}>강꾸 Kangku</Text>
          <Text style={{ fontSize: 17, color: '#76685b', lineHeight: 24 }}>
            강의자료 위에 낙서, 채팅, 공부 기록, 피드백을 얹어 수업을 함께 꾸미는 앱.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {features.map((feature) => (
              <Text key={feature} style={{ backgroundColor: '#2b241e', color: 'white', padding: 10, borderRadius: 999, fontWeight: '800' }}>
                {feature}
              </Text>
            ))}
          </View>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 28, padding: 18, gap: 12, borderWidth: 1, borderColor: '#eadfce' }}>
            <Text style={{ color: '#9a6b3e', fontWeight: '900' }}>DECORATE YOUR LECTURE</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#2b241e' }}>수업을 듣는 것에서, 꾸미는 것으로.</Text>
            <Text style={{ color: '#76685b' }}>자료 위 필기와 수업 채팅, 교수님께 한마디까지 한 화면에서 이어집니다.</Text>
          </View>
        </View>
      </SafeAreaView>
    </QueryClientProvider>
  );
}
