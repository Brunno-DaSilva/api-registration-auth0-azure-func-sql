/****** Object:  StoredProcedure [apidata].[Delete_AppRegistration]    */
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER   procedure [apidata].[Delete_AppRegistration]
(
	@AppRegistrationCode nvarchar(15)
  , @UserCode nvarchar(15)
)
as
begin
	set nocount on
	declare @Details nvarchar(max) = N'{"AppRegistrationCode":"' + @AppRegistrationCode + '"}'

	if @AppRegistrationCode is null or not exists (
		select 1
		from apidata.AppRegistration ar
		where ar.AppRegistrationCode = @AppRegistrationCode
	)
		throw 50001, 'The provided AppRegistrationCode was not found.', 1

	if @UserCode is null or not exists (
		select 1
		from db.[User] u
		where u.UserCode = @UserCode
	)
		throw 50002, 'The provided UserCode was not found.', 1

	begin try

		update apidata.AppRegistration
		set Deleted = getdate()
		  , DeletedBy = @UserCode
		where AppRegistrationCode = @AppRegistrationCode

		exec apidata.Insert_LogEvent 'Info'
								   , 'API Registration'
								   , 'apidata.Delete_AppRegistration'
								   , 'App Registration Deleted'
								   , @Details

	end try
	begin catch

		declare @UserName nvarchar(100) = suser_sname()
			  , @ErrorNumber int = error_number()
			  , @ErrorState int = error_state()
			  , @ErrorSeverity int = error_severity()
			  , @ErrorLine int = error_line()
			  , @ErrorProcedure nvarchar(max) = error_procedure()
			  , @ErrorMessage nvarchar(max) = error_message()

		exec apidata.Insert_LogEvent_DBError 'Error'
										   , 'API Registration'
										   , 'apidata.Delete_AppRegistration'
										   , 'Database Error'
										   , @Details
										   , @UserName
										   , @ErrorNumber
										   , @ErrorState
										   , @ErrorSeverity
										   , @ErrorLine
										   , @ErrorProcedure
										   , @ErrorMessage;

		throw

	end catch

end
