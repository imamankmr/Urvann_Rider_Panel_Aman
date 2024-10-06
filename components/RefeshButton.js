import React, { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native';

const RefreshButton = ({ onRefresh }) => {
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = () => {
        setRefreshing(true);
        onRefresh().finally(() => setRefreshing(false));
    };

    return (
        <TouchableOpacity
            style={styles.button}
            onPress={handleRefresh}
        >
            <Text style={styles.buttonText}>
                {(refreshing) ? "Refreshing" : "Refresh"}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#007BFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3, // For Android shadow
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default RefreshButton;