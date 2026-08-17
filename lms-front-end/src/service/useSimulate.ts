import { useState } from "react";
import { z } from "zod"

const simulateSchema = z.object({
    name: z.string(),
    id: z.string()
})

export type Simulate = z.infer<typeof simulateSchema>

export function useSimulatedApi(initialData = []) {
    const [data, setData] = useState<Simulate[]>(initialData);
    const [isLoading, setIsLoading] = useState(false);

    const createItem = async (newItemData: Simulate) => {
        setIsLoading(true);
        return new Promise((resolve) => {
            const newItem = { id: Date.now().toString(), name: newItemData.name };
            setData((prev) => [...prev, newItem]);
            setIsLoading(false);
            resolve(newItem);
        });
    };

    const updateItem = async (id: string, updatedData: Simulate) => {
        setIsLoading(true);
        return new Promise((resolve) => {
            setData((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedData } : item)));
            setIsLoading(false);
            resolve(true);

        });
    };

    const deleteItem = async (id: string) => {
        setIsLoading(true);
        return new Promise((resolve) => {
            setData((prev) => prev.filter((item) => item.id !== id));
            setIsLoading(false);
            resolve(true);
        });
    };

    return { data, isLoading, createItem, updateItem, deleteItem };
}