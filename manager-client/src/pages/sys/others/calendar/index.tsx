import { down, useMediaQuery } from "@/hooks";
import { useSettings } from "@/store/settingStore";
import { Card, CardContent } from "@/ui/card";
import { faker } from "@faker-js/faker";
import type { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayjs from "dayjs";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import CalendarEvent from "./calendar-event";
import CalendarEventForm, { type CalendarEventFormFieldType } from "./calendar-event-form";
import CalendarHeader, { type HandleMoveArg, type ViewType } from "./calendar-header";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";
import { StyledCalendar } from "./styles";

const DefaultEventInitValue = {
	id: faker.string.uuid(),
	title: "",
	description: "",
	licensePlate: "",
	allDay: false,
	start: dayjs(),
	end: dayjs(),
	color: "",
	spotId: "",
};
export default function Calendar() {
	const fullCalendarRef = useRef<FullCalendar>(null);
	const [view, setView] = useState<ViewType>("dayGridMonth");
	const [date, setDate] = useState(new Date());
	const [open, setOpen] = useState(false);
	const [eventInitValue, setEventInitValue] = useState<CalendarEventFormFieldType>(DefaultEventInitValue);
	const [eventFormType, setEventFormType] = useState<"add" | "edit">("add");

	const { themeMode } = useSettings();
	const xsBreakPoint = useMediaQuery(down("xs"));

	useEffect(() => {
		if (xsBreakPoint) {
			setView("listWeek");
		}
	}, [xsBreakPoint]);
	/**
	 * calendar header events
	 */
	const handleMove = (action: HandleMoveArg) => {
		const calendarApi = fullCalendarRef.current?.getApi();
		if (!calendarApi) return;
		switch (action) {
			case "prev":
				calendarApi.prev();
				break;
			case "next":
				calendarApi.next();
				break;
			case "today":
				calendarApi.today();
				break;
			default:
				break;
		}
		setDate(calendarApi.getDate());
	};
	const handleViewTypeChange = (view: ViewType) => {
		setView(view);
	};

	useLayoutEffect(() => {
		const calendarApi = fullCalendarRef.current?.getApi();
		if (!calendarApi) return;
		setTimeout(() => {
			calendarApi.changeView(view);
		});
	}, [view]);

	/**
	 * calendar grid events
	 */
	// select date range
	const handleDateSelect = (selectInfo: DateSelectArg) => {
		const calendarApi = selectInfo.view.calendar;
		calendarApi.unselect(); // clear date selection
		setOpen(true);
		setEventFormType("add");
		setEventInitValue({
			id: faker.string.uuid(),
			title: "",
			description: "",
			licensePlate: "",
			start: dayjs(selectInfo.startStr),
			end: dayjs(selectInfo.endStr),
			spotId: "",
			allDay: selectInfo.allDay,
		});
	};

	/**
	 * calendar event events
	 */
	// click event and open modal
	const handleEventClick = (arg: EventClickArg) => {
		const { title, extendedProps, allDay, start, end, backgroundColor, id } = arg.event;
		setOpen(true);
		setEventFormType("edit");
		const newEventValue: CalendarEventFormFieldType = {
			id,
			title,
			allDay,
			color: backgroundColor,
			description: extendedProps.description,
			licensePlate: extendedProps.licensePlate || "",
			spotId: extendedProps.spotId,
		};
		if (start) {
			newEventValue.start = dayjs(start);
		}

		if (end) {
			newEventValue.end = dayjs(end);
		}
		setEventInitValue(newEventValue);
	};
	const handleCancel = () => {
		setEventInitValue(DefaultEventInitValue);
		setOpen(false);
	};
	// edit event
	const handleEdit = async (values: CalendarEventFormFieldType) => {
		const { id, start, end } = values;
		const calendarApi = fullCalendarRef.current?.getApi();
		if (!calendarApi) return;
		// Update reservation via PATCH to avoid delete+create
		try {
			const payload = {
				licensePlate: (values as any).licensePlate || "",
				spotId: (values as any).spotId || "",
				start: start?.toDate().toISOString(),
				end: end?.toDate().toISOString(),
			};

			// Local overlap check excluding the event being edited
			const newStart = start?.toDate();
			const newEnd = end?.toDate();
			const spotId = (values as any).spotId || "";
			const licensePlate = ((values as any).licensePlate || "").trim();
			if (!spotId) {
				toast.error('Selecciona una plaza antes de actualizar la reserva.');
				return;
			}
			if (!licensePlate) {
				toast.error('Ingresa la placa antes de actualizar la reserva.');
				return;
			}
			const events = calendarApi.getEvents();
			const hasOverlap = events.some((ev) => {
				if (ev.id === id) return false;
				const evSpot = (ev.extendedProps as any)?.spotId || "";
				if (!evSpot || evSpot !== spotId) return false;
				const evStart = ev.start;
				if (!evStart || !newStart || !newEnd) return false;
				const evEnd = ev.end || evStart;
				return !( (evEnd <= newStart) || (evStart >= newEnd) );
			});
			if (hasOverlap) {
				toast.error('La plaza ya está reservada en ese horario (validación local).');
				return;
			}

			await apiClient.request({ url: `/parking/reservations/${id}`, method: "PATCH", data: payload });
			toast.success("Reserva actualizada");
			handleCancel();
			calendarApi.refetchEvents();
		} catch (err: any) {
			if (err?.response?.status === 409) {
				toast.error("La plaza ya está reservada en ese horario.");
			} else {
				// apiClient interceptor will show a generic error, but ensure user sees something
				toast.error(err?.response?.data?.message || "Error al actualizar la reserva");
			}
			console.error("Update reservation failed", err);
		}
	};
	// create event
	const handleCreate = async (values: CalendarEventFormFieldType) => {
		const calendarApi = fullCalendarRef.current?.getApi();
		if (!calendarApi) return;
		const { start, end } = values;
		const payload = {
			id: values.id || faker.string.uuid(),
			licensePlate: (values as any).licensePlate || "",
			spotId: (values as any).spotId || "",
			start: start?.toDate().toISOString(),
			end: end?.toDate().toISOString(),
			userId: null,
		};

		// Local overlap check against events currently shown in calendar to provide fast feedback
		const newStart = start?.toDate();
		const newEnd = end?.toDate();
		const spotId = (values as any).spotId || "";
		const licensePlate = ((values as any).licensePlate || "").trim();
		if (!spotId) {
			toast.error('Selecciona una plaza antes de crear la reserva.');
			return;
		}
		if (!licensePlate) {
			toast.error('Ingresa la placa antes de crear la reserva.');
			return;
		}

		const events = calendarApi.getEvents();
		const hasOverlap = events.some((ev) => {
			const evSpot = (ev.extendedProps as any)?.spotId || "";
			if (!evSpot || evSpot !== spotId) return false;
			const evStart = ev.start;
			if (!evStart || !newStart || !newEnd) return false;
			const evEnd = ev.end || evStart;
			// overlap if NOT (existing.end <= newStart OR existing.start >= newEnd)
			return !( (evEnd <= newStart) || (evStart >= newEnd) );
		});

		if (hasOverlap) {
			toast.error('La plaza ya está reservada en ese horario (validación local).');
			return;
		}

		try {
			await apiClient.post({ url: '/parking/reservations', data: payload });
			toast.success('Reserva creada');
			handleCancel();
			calendarApi.refetchEvents();
		} catch (err: any) {
			if (err?.response?.status === 409) {
				toast.error('La plaza ya está reservada en ese horario.');
			} else {
				toast.error(err?.response?.data?.message || 'Error al crear la reserva');
			}
			console.error('Create reservation failed', err);
		}
	};
	// delete event
	const handleDelete = async (id: string) => {
		const calendarApi = fullCalendarRef.current?.getApi();
		if (!calendarApi) return;
		try {
			await apiClient.delete({ url: `/parking/reservations/${id}` });
			toast.success('Reserva eliminada');
			calendarApi.refetchEvents();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Error al eliminar la reserva');
			console.error('Delete reservation failed', err);
		}
	};

	return (
		<>
			<Card className="h-full w-full">
				<CardContent className="h-full w-full">
					<StyledCalendar $themeMode={themeMode}>
						<CalendarHeader
							now={date}
							view={view}
							onMove={handleMove}
							onCreate={() => setOpen(true)}
							onViewTypeChange={handleViewTypeChange}
						/>
						<FullCalendar
							ref={fullCalendarRef}
							plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
							initialDate={date}
							initialView={xsBreakPoint ? "listWeek" : view}
							eventContent={CalendarEvent}
							editable
							selectable
							selectMirror
							dayMaxEvents
							headerToolbar={false}
							select={handleDateSelect}
							eventClick={handleEventClick}
							events={(info, successCallback, failureCallback) => {
								apiClient
									.get({ url: '/parking/reservations', params: { start: info.startStr, end: info.endStr } })
									.then((res: any) => {
										const events = (res as any[]).map((r: any) => ({
											id: r.id,
											title: `Spot ${r.spotId}`,
											start: r.start,
											end: r.end,
											color: '#00a76f',
											extendedProps: { spotId: r.spotId, licensePlate: r.licensePlate },
										}));
										successCallback(events);
									})
									.catch((e) => failureCallback(e));
								}}
						/>
					</StyledCalendar>
				</CardContent>
			</Card>
			<CalendarEventForm
				open={open}
				type={eventFormType}
				initValues={eventInitValue}
				onCancel={handleCancel}
				onDelete={handleDelete}
				onCreate={handleCreate}
				onEdit={handleEdit}
			/>
		</>
	);
}
