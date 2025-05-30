import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../Config/firebaseConfig';
import { AuthContext } from '../context/AuthContext';
import { LineChart, PieChart } from 'react-native-chart-kit';

export default function Statistics() {
  const { user } = useContext(AuthContext);
  const [dailySpending, setDailySpending] = useState([]);
  const [categorySpending, setCategorySpending] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const listsRef = collection(db, 'users', user.email, 'lists');
    const q = query(listsRef, where('completed', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

      const daily = calculateDailySpending(lists);
      setDailySpending(daily);

      const categories = calculateCategorySpending(lists);
      setCategorySpending(categories);

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const calculateDailySpending = (lists) => {
    const days = {};

    lists.forEach(list => {
      if (list.completedAt && list.totalSpent) {
        const date = new Date(list.completedAt);
        const dayKey = `${date.getDate()}/${date.getMonth() + 1}`;
        days[dayKey] = (days[dayKey] || 0) + list.totalSpent;
      }
    });

    const sortedKeys = Object.keys(days).sort((a, b) => {
      const [d1, m1] = a.split('/').map(Number);
      const [d2, m2] = b.split('/').map(Number);
      return new Date(2025, m1 - 1, d1) - new Date(2025, m2 - 1, d2);
    });

    const labels = sortedKeys.slice(-7);
    const data = labels.map(day => days[day]);

    return { labels, data };
  };

  const calculateCategorySpending = (lists) => {
    const categories = {};
    lists.forEach(list => {
      if (list.category && list.totalSpent) {
        categories[list.category] = (categories[list.category] || 0) + list.totalSpent;
      }
    });

    return Object.entries(categories).map(([name, amount], index) => ({
      name,
      amount,
      color: getRandomColor(index),
      legendFontColor: '#7F7F7F',
      legendFontSize: 15
    }));
  };

  const getRandomColor = (index) => {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      '#9966FF', '#FF9F40', '#00C49F', '#845EC2'
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        
        <Text>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      < Text style={styles.title}>THỐNG KÊ</Text>
    <ScrollView style={styles.container}>
    
      {/* Biểu đồ chi tiêu theo ngày */}
      <View style={styles.card}>
        <Text style={styles.title}>Chi tiêu theo ngày</Text>
        {dailySpending.data?.length > 0 ? (
          <LineChart
            data={{
              labels: dailySpending.labels,
              datasets: [{ data: dailySpending.data }]
            }}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(30, 144, 255, ${opacity})`,
              labelColor: () => '#333',
              style: { borderRadius: 16 }
            }}
            style={styles.chart}
          />
        ) : (
          <Text style={styles.emptyText}>Chưa có dữ liệu chi tiêu theo ngày</Text>
        )}
      </View>

      {/* Biểu đồ chi tiêu theo danh mục */}
      <View style={styles.card}>
        <Text style={styles.title}>Chi tiêu theo danh mục</Text>
        {categorySpending.length > 0 ? (
          <PieChart
            data={categorySpending}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        ) : (
          <Text style={styles.emptyText}>Chưa có dữ liệu chi tiêu theo danh mục</Text>
        )}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'red',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 15,
    marginVertical: 20,
  }
});
