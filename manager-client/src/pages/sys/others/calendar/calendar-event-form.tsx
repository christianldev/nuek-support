import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import apiClient from "@/api/apiClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Switch } from "@/ui/switch";
import { Textarea } from "@/ui/textarea";
import { faker } from "@faker-js/faker";
import type { EventInput } from "@fullcalendar/core";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircle } from "lucide-react";

export type CalendarEventFormFieldType = Pick<EventInput, "title" | "allDay" | "color"> & {
	id: string;
	description?: string;
	licensePlate: string;
	spotId?: string;
	start?: Dayjs;
	end?: Dayjs;
};

type Props = {
	type: "edit" | "add";
	open: boolean;
	onCancel: VoidFunction;
	onEdit: (event: CalendarEventFormFieldType) => void;
	onCreate: (event: CalendarEventFormFieldType) => void;
	onDelete: (id: string) => void;
	initValues: CalendarEventFormFieldType;
};

const COLORS = ["#00a76f", "#8e33ff", "#00b8d9", "#003768", "#22c55e", "#ffab00", "#ff5630", "#7a0916"];

const formSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	licensePlate: z.string().min(1, "License plate is required"),
	spotId: z.string().min(1, "Spot ID is required"),
	allDay: z.boolean(),
	start: z.date(),
	end: z.date(),
	color: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CalendarEventForm({
	type,
	open,
	onCancel,
	initValues = { id: faker.string.uuid(), licensePlate: "" },
	onEdit,
	onCreate,
	onDelete,
}: Props) {
	const title = type === "add" ? "Add Event" : "Edit Event";
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: initValues.title || (initValues.spotId ? `Spot ${initValues.spotId}` : ""),
			description: initValues.description || "",
			licensePlate: initValues.licensePlate || "",
			spotId: initValues.spotId || "",
			allDay: initValues.allDay || false,
			start: initValues.start?.toDate() || new Date(),
			end: initValues.end?.toDate() || new Date(),
			color: initValues.color || COLORS[0],
		},
	});

	const [spots, setSpots] = useState<{ id: string; name?: string }[]>([]);
	const [plateValidation, setPlateValidation] = useState<{
		status: "idle" | "valid" | "invalid" | "error";
		message: string;
	}>({ status: "idle", message: "" });
	const [isValidatingPlate, setIsValidatingPlate] = useState(false);

	useEffect(() => {
		if (open) {
			form.reset({
				title: initValues.title || (initValues.spotId ? `Spot ${initValues.spotId}` : ""),
				description: initValues.description || "",
				licensePlate: initValues.licensePlate || "",
				spotId: initValues.spotId || "",
				allDay: initValues.allDay || false,
				start: initValues.start?.toDate() || new Date(),
				end: initValues.end?.toDate() || new Date(),
				color: initValues.color || COLORS[0],
			});
			setPlateValidation({ status: "idle", message: "" });
		}
	}, [initValues, form, open]);

	useEffect(() => {
		if (!open) return;
		apiClient
			.get({ url: '/parking/spots' })
			.then((res: any) => setSpots(res || []))
			.catch(() => setSpots([]));
	}, [open]);

	const validatePlate = async (plate: string) => {
		if (!plate || plate.length < 3) {
			setPlateValidation({
				status: "error",
				message: "License plate must be at least 3 characters",
			});
			return false;
		}

		try {
			setIsValidatingPlate(true);
			setPlateValidation({ status: "idle", message: "" });

			const response = await apiClient.post<{ valid: boolean }>({
				url: "/parking/validate-plate",
				data: { licensePlate: plate },
			});

			console.log("SRI validation response:", response);

			if (response?.valid) {
				setPlateValidation({
					status: "valid",
					message: `✓ License plate ${plate} is valid`,
				});
				return true;
			} else {
				setPlateValidation({
					status: "invalid",
					message: `✗ Placa ingresada ${plate} no es válida`,
				});
				return false;
			}
		} catch (err: any) {
			const errorMsg =
				err.response?.data?.message || "Unable to validate license plate";
			setPlateValidation({
				status: "error",
				message: errorMsg,
			});
			return false;
		} finally {
			setIsValidatingPlate(false);
		}
	};

	const handleSubmit = async (values: FormValues) => {
		const isValidPlate = await validatePlate(values.licensePlate);
		if (!isValidPlate) return;

		const { id } = initValues;
		const normalizedTitle = values.spotId ? `Spot ${values.spotId}` : values.title;
		const event: CalendarEventFormFieldType = {
			...values,
			title: normalizedTitle,
			id,
			start: dayjs(values.start),
			end: dayjs(values.end),
		};
		if (type === "add") onCreate(event);
		if (type === "edit") onEdit(event);
	};

	return (
		<Dialog open={open} onOpenChange={onCancel}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title (auto por Spot)</FormLabel>
									<FormControl>
										<Input {...field} readOnly />
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea {...field} />
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="licensePlate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>License Plate <span className="text-red-500">*</span></FormLabel>
									<FormControl>
										<div className="flex gap-2">
											<Input
												{...field}
												placeholder="e.g., GTW8118"
												className="uppercase"
												maxLength={10}
												autoComplete="off"
												onChange={(e) => {
													field.onChange(e.target.value.toUpperCase());
													setPlateValidation({ status: "idle", message: "" });
												}}
											/>
										</div>
									</FormControl>
									{plateValidation.message && (
										<div
											className={`flex items-center gap-2 text-sm p-2 rounded-md mt-2 ${
												plateValidation.status === "invalid"
													? "bg-red-50 text-red-700"
													: "bg-yellow-50 text-yellow-700"
											}`}
										>
											{(plateValidation.status === "invalid" || plateValidation.status === "error") && (
												<AlertCircle className="w-4 h-4" />
											)}
											{plateValidation.message}
										</div>
									)}
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="spotId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Spot</FormLabel>
									<FormControl>
										<Select onValueChange={(v) => {
											field.onChange(v);
											form.setValue("title", `Spot ${v}`, { shouldDirty: true, shouldValidate: true });
										}} value={field.value}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select a spot" />
											</SelectTrigger>
											<SelectContent>
												{spots.length === 0 && (
													<SelectItem value="__no_spots__" disabled>
														No spots
													</SelectItem>
												)}
												{spots.filter((s) => s.id).map((s) => (
													<SelectItem key={s.id} value={s.id}>
														{s.name || s.id}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="allDay"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between">
									<FormLabel>All Day</FormLabel>
									<FormControl>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="start"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Start</FormLabel>
									<FormControl>
										<Input
											type="datetime-local"
											value={field.value.toISOString().slice(0, 16)}
											onChange={(e) => field.onChange(new Date(e.target.value))}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="end"
							render={({ field }) => (
								<FormItem>
									<FormLabel>End</FormLabel>
									<FormControl>
										<Input
											type="datetime-local"
											value={field.value.toISOString().slice(0, 16)}
											onChange={(e) => field.onChange(new Date(e.target.value))}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="color"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Color</FormLabel>
									<FormControl>
										<div className="flex gap-2">
											<Input type="color" {...field} />
											<div className="flex gap-1">
												{COLORS.map((color) => (
													<button
														key={color}
														type="button"
														className="size-6 rounded-full border"
														style={{ backgroundColor: color }}
														onClick={() => field.onChange(color)}
													/>
												))}
											</div>
										</div>
									</FormControl>
								</FormItem>
							)}
						/>
						<DialogFooter>
							{type === "edit" && (
								<Button
									variant="ghost"
									size="icon"
									type="button"
									onClick={() => {
										onDelete(initValues.id);
										onCancel();
									}}
								>
									<Icon icon="fluent:delete-16-filled" size={20} className="text-error!" />
								</Button>
							)}
							<div className="flex gap-2">
								<Button variant="ghost" type="button" onClick={onCancel}>
									Cancel
								</Button>
								<Button type="submit" disabled={isValidatingPlate}>
									{isValidatingPlate ? "Validando placa..." : "Save"}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
