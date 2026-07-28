import { useState } from "react";

export function useSimulatedApi(initialData = []) {
    const [data, setData] = useState(initialData);
    const [isLoading, setIsLoading] = useState(false);

    const createItem = async (newItemData) => {
        setIsLoading(true);
        return new Promise((resolve) => {
            const newItem = { id: Date.now(), name: newItemData.name };
            setData((prev) => [...prev, newItem]);
            setIsLoading(false);
            resolve(newItem);
        });
    };

    const updateItem = async (id, updatedData) => {
        setIsLoading(true);
        return new Promise((resolve) => {
            setData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedData } : item)));
            setIsLoading(false);
            resolve(true);

        });
    };

    const deleteItem = async (id) => {
        setIsLoading(true);
        return new Promise((resolve) => {
            setData((prev) => prev.filter((item) => item.id !== id));
            setIsLoading(false);
            resolve(true);
        });
    };

    return { data, isLoading, createItem, updateItem, deleteItem };
}