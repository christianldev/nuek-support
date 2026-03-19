import type { EventContentArg } from "@fullcalendar/core";

export default function CalendarEvent(eventInfo: EventContentArg) {
	const { event, backgroundColor } = eventInfo;
	const licensePlate = (event.extendedProps as any)?.licensePlate;

	return (
		<div
			className="fc-event-main-wrapper"
			style={{
				color: backgroundColor,
			}}
		>
			<div className="fc-event-main-frame">
				<div className="fc-event-time">{'Placa: ' + licensePlate}</div>

				<div className="fc-event-title-container">
					<div className="fc-event-title fc-sticky">{event.title}</div>
				</div>
			</div>
		</div>
	);
}
