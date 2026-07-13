import { useState } from "react";

export function useSimulatedApi(initialData = []) {
    const [data, setData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);

    const createItem = async (newItemData) => {
        setIsLoading(true);
        return new Promise((resolve) => {
            setTimeout(() => {
                const newItem = { id: Date.now(), name: newItemData.name };
                setData((prev) => [...prev, newItem]);
                setIsLoading(false);
                resolve(newItem);
            }, 400); // Simulate network latency
        });
    };

    const updateItem = async (id, updatedData) => {
        setIsLoading(true);
        return new Promise((resolve) => {
            setTimeout(() => {
                setData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedData } : item)));
                setIsLoading(false);
                resolve(true);
            }, 400);
        });
    };

    const deleteItem = async (id) => {
        setIsLoading(true);
        return new Promise((resolve) => {
            setTimeout(() => {
                setData((prev) => prev.filter((item) => item.id !== id));
                setIsLoading(false);
                resolve(true);
            }, 400);
        });
    };

    return { data, isLoading, createItem, updateItem, deleteItem };
}