from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, date
import logging
from .plant_service import PlantService
from .auto_harvest_service import AutoHarvestService
from ..config import supabase

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.setup_jobs()

    def setup_jobs(self):
        self.scheduler.add_job(
            func=self.run_daily_decay,
            trigger=CronTrigger(hour=0, minute=1),
            id='daily_decay',
            name='Daily XP Decay',
            replace_existing=True
        )
        
        self.scheduler.add_job(
            func=self.run_auto_harvest,
            trigger=CronTrigger(hour=0, minute=5),
            id='auto_harvest',
            name='Auto Harvest Completed Tasks',
            replace_existing=True
        )

    async def run_daily_decay(self):
        try:
            logger.info("Starting daily XP decay process")
            
            result = supabase.table("user_progress").select("user_id").execute()
            user_ids = [row["user_id"] for row in result.data]
            
            for user_id in user_ids:
                try:
                    await PlantService.apply_daily_decay(user_id)
                    logger.info(f"Applied daily decay for user {user_id}")
                except Exception as e:
                    logger.error(f"Failed to apply decay for user {user_id}: {str(e)}")
            
            logger.info(f"Daily decay process completed for {len(user_ids)} users")
            
        except Exception as e:
            logger.error(f"Daily decay process failed: {str(e)}")

    async def run_auto_harvest(self):
        try:
            logger.info("Starting auto-harvest process")
            await AutoHarvestService.check_and_harvest_completed_tasks()
            logger.info("Auto-harvest process completed")
        except Exception as e:
            logger.error(f"Auto-harvest process failed: {str(e)}")

    def start(self):
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("Scheduler started successfully")

    def shutdown(self):
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Scheduler shut down successfully")

scheduler_service = SchedulerService()